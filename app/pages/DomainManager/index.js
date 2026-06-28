import React, { Component } from 'react';
import { withRouter } from 'react-router';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import * as myDomainsActions from '../../ducks/myDomains';
import { formatName } from '../../utils/nameHelpers';
import './domain-manager.scss';
import { clientStub as aClientStub } from '../../background/analytics/client';
import fs from 'fs';
import ClaimNameForPayment from './ClaimNameForPayment';
import {HeaderItem, HeaderRow, Table, TableItem, TableRow} from "../../components/Table";
import Blocktime from "../../components/Blocktime";
import BidSearchInput from "../../components/BidSearchInput";
import {displayBalance} from "../../utils/balances";
import {getPageIndices} from "../../utils/pageable";
import c from "classnames";
import Dropdown from "../../components/Dropdown";
import BulkTransfer from "./BulkTransfer";
import * as networks from "hsd/lib/protocol/networks";
import {finalizeAll} from "../../ducks/names";
import {showError, showSuccess} from "../../ducks/notifications";
import dbClient from "../../utils/dbClient";
import BulkFinalizeWarningModal from "./BulkFinalizeWarningModal";
import {I18nContext} from "../../utils/i18n";
import Checkbox from "../../components/Checkbox";
import { addToRenewalQueue } from '../../ducks/renewalQueue';

const {dialog} = require('@electron/remote');

const analytics = aClientStub(() => require('electron').ipcRenderer);

const ITEM_PER_DROPDOWN = [
  {label: '5', value: 5},
  {label: '10', value: 10},
  {label: '20', value: 20},
  {label: '50', value: 50},
  {label: '100', value: 100},
];

const DM_ITEMS_PER_PAGE_KEY = 'domain-manager-items-per-page';
const DM_SORT_KEY = 'domain-manager-sort-key';
const DM_SORT_DIRECTION = 'domain-manager-sort-direction';

class DomainManager extends Component {
  static propTypes = {
    isFetching: PropTypes.bool.isRequired,
    getMyNames: PropTypes.func.isRequired,
    names: PropTypes.object.isRequired,
  };

  static contextType = I18nContext;

  state = {
    query: '',
    isShowingNameClaimForPayment: false,
    isShowingBulkTransfer: false,
    isConfirmingBulkFinalize: false,
    isShowingRenewalQueue: false,
    currentPageIndex: 0,
    itemsPerPage: 10,
    selectedNames: [],
    sortKey: 'domain',
    sortDirection: 'asc',
  };

  shouldComponentUpdate(nextProps, nextState) {
    return this.props.names !== nextProps.names
      || this.props.isFetching !== nextProps.isFetching
      || this.state.query !== nextState.query
      || this.state.isShowingNameClaimForPayment !== nextState.isShowingNameClaimForPayment
      || this.state.isShowingBulkTransfer !== nextState.isShowingBulkTransfer
      || this.state.isConfirmingBulkFinalize !== nextState.isConfirmingBulkFinalize
      || this.state.isShowingRenewalQueue !== nextState.isShowingRenewalQueue
      || this.state.currentPageIndex !== nextState.currentPageIndex
      || this.state.itemsPerPage !== nextState.itemsPerPage
      || this.state.selectedNames.join('') !== nextState.selectedNames.join('')
      || this.state.sortKey !== nextState.sortKey
      || this.state.sortDirection !== nextState.sortDirection;
  }

  async componentDidMount() {
    this.props.getMyNames();
    const itemsPerPage = await dbClient.get(DM_ITEMS_PER_PAGE_KEY);
    const sortKey = await dbClient.get(DM_SORT_KEY);
    const sortDirection = await dbClient.get(DM_SORT_DIRECTION);

    this.setState({
      itemsPerPage: itemsPerPage || 10,
      sortKey: sortKey || 'domain',
      sortDirection: sortDirection || 'asc',
    });

    analytics.screenView('Domain Manager');
  }

  handleSelectName = (name) => {
    this.setState(prevState => {
      const { selectedNames } = prevState;
      if (selectedNames.includes(name)) {
        return { selectedNames: selectedNames.filter(n => n !== name) };
      } else {
        return { selectedNames: [...selectedNames, name] };
      }
    });
  };

  handleSelectAll = (currentPageNames) => {
    this.setState(prevState => {
      const { selectedNames } = prevState;
      const isAllSelected = currentPageNames.length > 0 && currentPageNames.every(name => selectedNames.includes(name));
      if (isAllSelected) {
        return {
          selectedNames: selectedNames.filter(name => !currentPageNames.includes(name)),
        };
      } else {
        const toAdd = currentPageNames.filter(name => !selectedNames.includes(name));
        return {
          selectedNames: [...selectedNames, ...toAdd],
        };
      }
    });
  };

  onChange = (name) => (e) => {
    this.setState({
      [name]: e.target.value,
    });
  };

  handleSort = (key) => {
    this.setState(prevState => {
      const nextDirection = prevState.sortKey === key && prevState.sortDirection === 'asc' ? 'desc' : 'asc';
      dbClient.put(DM_SORT_KEY, key);
      dbClient.put(DM_SORT_DIRECTION, nextDirection);
      return {
        sortKey: key,
        sortDirection: nextDirection,
        currentPageIndex: 0,
      };
    });
  };

  getNamesList() {
    const { names, network } = this.props;
    const { query, sortKey, sortDirection } = this.state;

    if (
      this._lastNames === names &&
      this._lastQuery === query &&
      this._lastSortKey === sortKey &&
      this._lastSortDirection === sortDirection &&
      this._cachedList
    ) {
      return this._cachedList;
    }

    this._lastNames = names;
    this._lastQuery = query;
    this._lastSortKey = sortKey;
    this._lastSortDirection = sortDirection;

    const namesList = Object.keys(names);
    let filteredList = namesList;

    if (query) {
      const lowerQuery = query.toLowerCase();
      filteredList = filteredList.filter(name => name.includes(lowerQuery));
    }

    filteredList.sort((a, b) => {
      let valA, valB;
      if (sortKey === 'expires') {
        const renewalWindow = networks[network].names.renewalWindow;
        valA = (names[a]?.renewal || 0) + renewalWindow;
        valB = (names[b]?.renewal || 0) + renewalWindow;
      } else if (sortKey === 'paid') {
        valA = names[a]?.highest || 0;
        valB = names[b]?.highest || 0;
      } else {
        valA = a;
        valB = b;
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this._cachedList = filteredList;
    return filteredList;
  }

  handleExportClick() {
    let names = Object.keys(this.props.names);
    let data = names.join('\n');

    let savePath = dialog.showSaveDialogSync({
      filters: [{name: 'spreadsheet', extensions: ['csv']}],
    });

    if (savePath) {
      fs.writeFile(savePath, data, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  }

  handleFinalizeAll = async () => {
    const {
      finalizeAll,
      showError,
      showSuccess,
    } = this.props;

    const { t } = this.context;

    if (!this.state.isConfirmingBulkFinalize) {
      return this.setState({ isConfirmingBulkFinalize: true });
    }

    try {
      const res = await finalizeAll();
      if (res !== null) {
        showSuccess(t('finalizeSuccess'));
      }
      this.setState({ isConfirmingBulkFinalize: false });
    } catch (e) {
      showError(e.message);
    }
  };

  renderGoTo(namesList) {
    const {currentPageIndex, itemsPerPage} = this.state;
    const { t } = this.context;

    const totalPages = Math.ceil(namesList.length / itemsPerPage);
    return (
      <div className="domain-manager__page-control__dropdowns">
        <div className="domain-manager__go-to">
          <div className="domain-manager__go-to__text">{`${t('itemsPerPage')}:`}</div>
          <Dropdown
            className="domain-manager__go-to__dropdown transactions__items-per__dropdown"
            items={ITEM_PER_DROPDOWN}
            onChange={async itemsPerPage => {
              await dbClient.put(DM_ITEMS_PER_PAGE_KEY, itemsPerPage);
              this.setState({
                itemsPerPage,
                currentPageIndex: 0,
              })
            }}
            currentIndex={ITEM_PER_DROPDOWN.findIndex(({ value }) => value === this.state.itemsPerPage)}
          />
        </div>
        <div className="domain-manager__go-to">
          <div className="domain-manager__go-to__text">{t('page')}</div>
          <Dropdown
            className="domain-manager__go-to__dropdown"
            items={Array(totalPages).fill(0).map((_, i) => ({label: `${i + 1}`}))}
            onChange={currentPageIndex => this.setState({currentPageIndex})}
            currentIndex={currentPageIndex}
          />
          <div className="domain-manager__go-to__total">of {totalPages}</div>
        </div>
      </div>
    );
  }

  renderControls(namesList) {
    const {
      currentPageIndex,
      itemsPerPage,
    } = this.state;

    const totalPages = Math.ceil(namesList.length / itemsPerPage);
    const pageIndices = getPageIndices(namesList, itemsPerPage, currentPageIndex);

    return (
      <div className="domain-manager__page-control">
        <div className="domain-manager__page-control__numbers">
          <div
            className="domain-manager__page-control__start"
            onClick={() => this.setState({
              currentPageIndex: Math.max(currentPageIndex - 1, 0),
            })}
          />
          {pageIndices.map((pageIndex, i) => {
            if (pageIndex === '...') {
              return (
                <div key={`${pageIndex}-${i}`} className="domain-manager__page-control__ellipsis">...</div>
              );
            }

            return (
              <div
                key={`${pageIndex}-${i}`}
                className={c('domain-manager__page-control__page', {
                  'domain-manager__page-control__page--active': currentPageIndex === pageIndex,
                })}
                onClick={() => this.setState({currentPageIndex: pageIndex})}
              >
                {pageIndex + 1}
              </div>
            );
          })}
          <div
            className="domain-manager__page-control__end"
            onClick={() => this.setState({
              currentPageIndex: Math.min(currentPageIndex + 1, totalPages - 1),
            })}
          />
        </div>
        {this.renderGoTo(namesList)}
      </div>
    );
  }

  renderBulkFinalize() {
    const {names} = this.props;
    const namesList = Object.keys(names);
    const finalizables = [];

    for (const name of namesList) {
      const domain = names[name];
      const remainingBlocks = (domain.transfer + networks[this.props.network].names.transferLockup) - this.props.height;
      if (domain.transfer && remainingBlocks <= 0) {
        finalizables.push(name);
      }
    }

    return !!finalizables.length && (
      <button
        className="extension_cta_button domain-manager__export-btn"
        onClick={this.handleFinalizeAll}
      >
        {`${this.context.t('bulkFinalize')} (${finalizables.length})`}
      </button>
    )
  }

  renderList(namesList) {
    const {history} = this.props;
    const {t} = this.context;
    const {
      query,
      currentPageIndex: i,
      itemsPerPage: n,
      selectedNames,
    } = this.state;

    const start = i * n;
    const end = start + n;
    const currentPageNames = namesList.slice(start, end);
    const isAllSelected = currentPageNames.length > 0 && currentPageNames.every(name => selectedNames.includes(name));

    return (
      <div className="domain-manager">
        <div className="domain-manager__buttons">
          <button
            className="extension_cta_button domain-manager__export-btn"
            onClick={this.handleExportClick.bind(this)}
          >
            {t('export')}
          </button>
          <button
            className="extension_cta_button domain-manager__export-btn"
            onClick={() => this.setState({
              isShowingNameClaimForPayment: true,
            })}
          >
            {t('claimPaidTransfer')}
          </button>
          <button
            className="extension_cta_button domain-manager__export-btn"
            onClick={() => this.setState({
              isShowingBulkTransfer: true,
            })}
          >
            {t('bulkTransfer')}
          </button>
          {this.renderBulkFinalize()}
          {selectedNames.length > 0 && (
            <button
              className="extension_cta_button domain-manager__export-btn"
              onClick={() => {
                this.props.addToRenewalQueue(selectedNames, this.props.network);
                this.setState({ selectedNames: [] });
                history.push('/renewal_queue');
              }}
            >
              {t('addToRenewalQueue')}
            </button>
          )}
        </div>
        {this.renderControls(namesList)}
        <BidSearchInput
          className="domain-manager__search"
          placeholder={t('domainSearchPlaceholder')}
          onChange={this.onChange('query')}
          value={query}
        />
        <Table className="domain-manager__table">
          <HeaderRow>
            <HeaderItem className="domain-manager__table__checkbox-col">
              <Checkbox
                checked={isAllSelected}
                onChange={() => this.handleSelectAll(currentPageNames)}
              />
            </HeaderItem>
            <HeaderItem className="clickable" onClick={() => this.handleSort('domain')}>
              {t('domain')} {this.state.sortKey === 'domain' && (this.state.sortDirection === 'asc' ? '▲' : '▼')}
            </HeaderItem>
            <HeaderItem className="clickable" onClick={() => this.handleSort('expires')}>
              {t('expiresOn')} {this.state.sortKey === 'expires' && (this.state.sortDirection === 'asc' ? '▲' : '▼')}
            </HeaderItem>
            <HeaderItem className="clickable" onClick={() => this.handleSort('paid')}>
              {t('hnsPaid')} {this.state.sortKey === 'paid' && (this.state.sortDirection === 'asc' ? '▲' : '▼')}
            </HeaderItem>
          </HeaderRow>
          {namesList.length ? currentPageNames.map((name) => {
            return (
              <DomainRow
                key={`${name}`}
                name={name}
                selected={selectedNames.includes(name)}
                onSelect={() => this.handleSelectName(name)}
                onClick={() => history.push(`/domain_manager/${name}`)}
              />
            );
          }) :
          <TableRow className="table__empty-row">
            {this.context.t('domainManagerEmpty')}
          </TableRow>}
        </Table>
      </div>
    );
  }

  renderEmpty() {
    const { t } = this.context;
    return (
      <div className="domain-manager">
        <div className="domain-manager__buttons">
          <button
            className="extension_cta_button domain-manager__export-btn"
            onClick={() => this.setState({
              isShowingNameClaimForPayment: true,
            })}
          >
            {t('claimNamePaymentTitle')}
          </button>
        </div>
        <div className="domain-manager__empty-text">
          {t('domainManagerEmpty')}
        </div>
      </div>
    );
  }

  renderBody(namesList) {
    const {isFetching} = this.props;
    const { t } = this.context;

    if (isFetching) {
      return (
        <div className="domain-manager">
          <div className="domain-manager__loading">
            {t('loadingNDomains', namesList.length)}
          </div>
        </div>
      );
    }

    return this.renderList(namesList);
  }

  renderConfirmFinalizeModal() {
    if (this.state.isConfirmingBulkFinalize) {
      return (
        <BulkFinalizeWarningModal
          onClose={() => this.setState({ isConfirmingBulkFinalize: false })}
          onClick={this.handleFinalizeAll}
        />
      );
    }
  }

  render() {
    const namesList = this.getNamesList();

    return (
      <>
        {this.renderBody(namesList)}
        {this.renderControls(namesList)}
        {this.renderConfirmFinalizeModal()}
        {this.state.isShowingBulkTransfer && (
          <BulkTransfer
            onClose={() => this.setState({
              isShowingBulkTransfer: false,
            })}
          />
        )}
        {this.state.isShowingNameClaimForPayment && (
          <ClaimNameForPayment
            onClose={() => this.setState({
              isShowingNameClaimForPayment: false,
            })}
          />
        )}
      </>
    );
  }
}

export default withRouter(
  connect(
    state => ({
      names: state.myDomains.names,
      isFetching: state.myDomains.isFetching,
      height: state.node.chain.height,
      network: state.wallet.network,
      wid: state.wallet.wid,
    }),
    dispatch => ({
      getMyNames: () => dispatch(myDomainsActions.getMyNames()),
      finalizeAll: () => dispatch(finalizeAll()),
      showSuccess: (message) => dispatch(showSuccess(message)),
      showError: (message) => dispatch(showError(message)),
      addToRenewalQueue: (names, network) => dispatch(addToRenewalQueue(names, network)),
    }),
  )(DomainManager),
);


const DomainRow = connect(
  state => ({
    names: state.myDomains.names,
    network: state.wallet.network,
  }),
)(_DomainRow);

function _DomainRow(props) {
  const { name, names, onClick, network, selected, onSelect } = props;
  return (
    <TableRow key={`${name}`} onClick={onClick}>
      <TableItem onClick={e => e.stopPropagation()} className="domain-manager__table__checkbox-col">
        <Checkbox
          checked={selected}
          onChange={onSelect}
        />
      </TableItem>
      <TableItem>{formatName(name)}</TableItem>
      <TableItem>
        <Blocktime
          height={names[name].renewal + networks[network].names.renewalWindow}
          format="ll"
          fromNow
        />
      </TableItem>
      <TableItem>{displayBalance(names[name].highest, true)}</TableItem>
    </TableRow>
  );
}
