import React, { Component } from 'react';
import PropTypes from "prop-types";
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { HeaderItem, HeaderRow, Table, TableItem, TableRow } from '../../components/Table';
import { showError, showSuccess } from '../../ducks/notifications';
import { renewMany, getNameInfo } from "../../ducks/names";
import { getMyNames } from "../../ducks/myDomains";
import { fetchPendingTransactions } from "../../ducks/walletActions";
import { removeFromRenewalQueue, clearRenewalQueue } from "../../ducks/renewalQueue";
import { I18nContext } from "../../utils/i18n";
import Alert from "../../components/Alert";
import Submittable from '../../components/Submittable';
import Blocktime from "../../components/Blocktime";
import * as networks from "hsd/lib/protocol/networks";
import c from 'classnames';
import './renewal-queue.scss';

@withRouter
@connect(
  (state) => ({
    network: state.wallet.network,
    chainHeight: state.node.chain.height,
    wid: state.wallet.wid,
    watchOnly: state.wallet.watchOnly,
    myDomainsNames: state.myDomains.names,
    names: state.names,
    renewalQueueNames: state.renewalQueue ? state.renewalQueue.names : [],
    fees: state.node.fees,
  }),
  (dispatch) => ({
    showSuccess: (message) => dispatch(showSuccess(message)),
    showError: (message) => dispatch(showError(message)),
    renewMany: (names, passphrase, feeRate) => dispatch(renewMany(names, passphrase, feeRate)),
    getMyNames: () => dispatch(getMyNames()),
    fetchPendingTransactions: () => dispatch(fetchPendingTransactions()),
    removeFromRenewalQueue: (name, network) => dispatch(removeFromRenewalQueue(name, network)),
    clearRenewalQueue: (network) => dispatch(clearRenewalQueue(network)),
    getNameInfo: (name) => dispatch(getNameInfo(name)),
  }),
)
export default class RenewalQueue extends Component {
  static propTypes = {
    network: PropTypes.string.isRequired,
    chainHeight: PropTypes.number.isRequired,
    watchOnly: PropTypes.bool.isRequired,
    wid: PropTypes.string.isRequired,
    myDomainsNames: PropTypes.object.isRequired,
    names: PropTypes.object.isRequired,
    renewalQueueNames: PropTypes.array.isRequired,
    renewMany: PropTypes.func.isRequired,
    getMyNames: PropTypes.func.isRequired,
    fetchPendingTransactions: PropTypes.func.isRequired,
    removeFromRenewalQueue: PropTypes.func.isRequired,
    clearRenewalQueue: PropTypes.func.isRequired,
    showSuccess: PropTypes.func.isRequired,
    showError: PropTypes.func.isRequired,
    fees: PropTypes.object,
  };

  static contextType = I18nContext;

  state = {
    passphrase: '',
    isExecuting: false,
    errorMessage: '',
    errors: {},
    feeOption: 'slow',
  };

  estimateRenewalFee = (numNames) => {
    const { fees } = this.props;
    const { feeOption } = this.state;
    const feeRate = (fees && fees[feeOption]) || (feeOption === 'slow' ? 0.001 : feeOption === 'standard' ? 0.01 : 0.05);

    // 1 input + 1 output per name ≈ 250 bytes per name
    // Base transaction size ≈ 250 bytes
    const txSize = 250 + numNames * 250;
    const txSizeKB = txSize / 1000;

    return txSizeKB * feeRate;
  };

  componentDidMount() {
    this.props.getMyNames();
    this.props.fetchPendingTransactions();
    
    // Also fetch detailed name info for all queue items so names state is populated
    this.props.renewalQueueNames.forEach(name => {
      this.props.getNameInfo(name).catch(() => {});
    });
  }

  componentDidUpdate(prevProps) {
    if (this.props.chainHeight !== prevProps.chainHeight) {
      this.props.getMyNames();
      this.props.fetchPendingTransactions();
    }
    if (this.props.renewalQueueNames.join('') !== prevProps.renewalQueueNames.join('')) {
      const addedNames = this.props.renewalQueueNames.filter(n => !prevProps.renewalQueueNames.includes(n));
      addedNames.forEach(name => {
        this.props.getNameInfo(name).catch(() => {});
      });
    }
  }

  handleExecute = async () => {
    const { renewalQueueNames, watchOnly, myDomainsNames, names, chainHeight, network, fees } = this.props;
    const { passphrase, feeOption } = this.state;
    const { t } = this.context;

    const namesToRenew = renewalQueueNames.filter(name => {
      const d = myDomainsNames[name];
      const isRenewed = d && d.renewal === chainHeight;
      const isProcessing = names[name]?.pendingOperation === 'RENEW';
      return d && !isRenewed && !isProcessing;
    });

    if (namesToRenew.length === 0) {
      this.setState({ errorMessage: t('noBidsToReveal') || 'No names require renewal at this time.' });
      return;
    }

    if (!watchOnly && !passphrase) {
      this.setState({ errorMessage: t('invalidPassword') || 'Password is required' });
      return;
    }

    this.setState({
      isExecuting: true,
      errorMessage: '',
    });

    try {
      const feeRate = (fees && fees[feeOption]) || (feeOption === 'slow' ? 0.001 : feeOption === 'standard' ? 0.01 : 0.05);
      const { successfulNames, failedNames } = await this.props.renewMany(namesToRenew, passphrase, feeRate);
      
      const nextErrors = { ...this.state.errors };

      if (successfulNames && successfulNames.length) {
        successfulNames.forEach(name => {
          delete nextErrors[name];
        });
      }

      if (failedNames && failedNames.length) {
        failedNames.forEach(item => {
          nextErrors[item.name] = item.error;
        });
      }

      this.setState({
        isExecuting: false,
        passphrase: '',
        errors: nextErrors,
      });

      if (successfulNames && successfulNames.length) {
        this.props.showSuccess(t('renewSuccess'));
      }
      if (failedNames && failedNames.length) {
        this.props.showError(t('genericError') || 'Some renewals failed');
      }

      await this.props.fetchPendingTransactions();
      this.props.getMyNames();
    } catch (e) {
      this.setState({
        isExecuting: false,
        errorMessage: e.message,
      });
      this.props.showError(e.message);
    }
  };

  renderStatus(name) {
    const { myDomainsNames, names, chainHeight } = this.props;
    const { t } = this.context;
    const { errors } = this.state;

    const error = errors[name];
    if (error) {
      return <span className="renewal-queue-page__status renewal-queue-page__status--failed">{t('renewStatusFailed', error) || `Failed: ${error}`}</span>;
    }

    const d = myDomainsNames[name];
    if (!d) {
      return <span className="renewal-queue-page__status renewal-queue-page__status--waiting">{t('renewStatusWaiting')}</span>;
    }

    const isRenewed = d.renewal === chainHeight;
    const isProcessing = names[name]?.pendingOperation === 'RENEW';

    if (isRenewed) {
      return <span className="renewal-queue-page__status renewal-queue-page__status--success">{t('renewStatusCurrentBlock')}</span>;
    }

    if (isProcessing) {
      return <span className="renewal-queue-page__status renewal-queue-page__status--processing">{t('renewStatusNextBlock')}</span>;
    }

    return <span className="renewal-queue-page__status renewal-queue-page__status--waiting">{t('renewStatusWaiting')}</span>;
  }

  render() {
    const { renewalQueueNames, watchOnly, myDomainsNames, names, chainHeight, network } = this.props;
    const { passphrase, isExecuting, errorMessage } = this.state;
    const { t } = this.context;

    const namesToRenew = renewalQueueNames.filter(name => {
      const d = myDomainsNames[name];
      const isRenewed = d && d.renewal === chainHeight;
      const isProcessing = names[name]?.pendingOperation === 'RENEW';
      return d && !isRenewed && !isProcessing;
    });

    return (
      <div className="renewal-queue-page">
        <div className="renewal-queue-page__header">
          <div className="renewal-queue-page__title">{t('renewalQueue')}</div>
          {renewalQueueNames.length > 0 && (
            <button
              className="renewal-queue-page__clear-btn"
              onClick={() => this.props.clearRenewalQueue(network)}
              disabled={isExecuting}
            >
              {t('clearQueue') || 'Clear Queue'}
            </button>
          )}
        </div>

        {errorMessage && <Alert type="error" message={errorMessage} />}

        <div className="renewal-queue-page__table-wrapper">
          <Table className="renewal-queue-page__table">
            <HeaderRow>
              <HeaderItem>{t('domain')}</HeaderItem>
              <HeaderItem>{t('expiresOn')}</HeaderItem>
              <HeaderItem>{t('status')}</HeaderItem>
              <HeaderItem className="renewal-queue-page__action-col" />
            </HeaderRow>

            {renewalQueueNames.length > 0 ? (
              renewalQueueNames.map((name) => {
                const d = myDomainsNames[name];
                return (
                  <TableRow key={name}>
                    <TableItem>{name}</TableItem>
                    <TableItem>
                      {d ? (
                        <Blocktime
                          height={d.renewal + networks[network].names.renewalWindow}
                          format="ll"
                          fromNow
                        />
                      ) : '--'}
                    </TableItem>
                    <TableItem>{this.renderStatus(name)}</TableItem>
                    <TableItem className="renewal-queue-page__action-col">
                      <div
                        className="renewal-queue-page__remove-icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          this.props.removeFromRenewalQueue(name, network);
                        }}
                      />
                    </TableItem>
                  </TableRow>
                );
              })
            ) : (
              <TableRow className="table__empty-row">
                {t('domainManagerEmpty')}
              </TableRow>
            )}
          </Table>
        </div>

        {renewalQueueNames.length > 0 && namesToRenew.length > 0 && (
          <div className="renewal-queue-page__fee-estimate-container">
            <div className="renewal-queue-page__fee-selector">
              <span className="renewal-queue-page__fee-selector-label">{t('feeSpeed') || 'Speed'}:</span>
              <div className="renewal-queue-page__fee-options">
                {['slow', 'standard', 'fast'].map(option => (
                  <button
                    key={option}
                    type="button"
                    className={c('renewal-queue-page__fee-option-btn', {
                      'renewal-queue-page__fee-option-btn--active': this.state.feeOption === option,
                    })}
                    onClick={() => this.setState({ feeOption: option })}
                  >
                    {option === 'standard' ? (t('normal') || 'Normal') : (t(option) || option.charAt(0).toUpperCase() + option.slice(1))}
                  </button>
                ))}
              </div>
            </div>
            <div className="renewal-queue-page__fee-estimate-row">
              <span className="renewal-queue-page__fee-estimate-label">{t('estimatedFee') || 'Estimated Fee'}:</span>
              <span className="renewal-queue-page__fee-estimate-value">
                {this.estimateRenewalFee(namesToRenew.length).toFixed(5)} HNS
              </span>
            </div>
            <div className="renewal-queue-page__free-note">
              {t('renewalFreeNote') || 'Handshake renewals have no annual registry fees.'}
            </div>
          </div>
        )}

        {renewalQueueNames.length > 0 && namesToRenew.length > 0 && !watchOnly && (
          <div className="renewal-queue-page__password-container">
            <div className="renewal-queue-page__input-label">{t('renewPasswordPrompt')}</div>
            <div className="renewal-queue-page__password-input">
              <Submittable onSubmit={this.handleExecute}>
                <input
                  type="password"
                  placeholder={t('passwordInputPlaceholder')}
                  onChange={e => this.setState({ passphrase: e.target.value, errorMessage: '' })}
                  value={passphrase}
                  disabled={isExecuting}
                  autoFocus
                />
              </Submittable>
            </div>
          </div>
        )}

        {renewalQueueNames.length > 0 && (
          <div className="renewal-queue-page__actions">
            <button
              className="extension_cta_button"
              disabled={isExecuting || namesToRenew.length === 0 || (!watchOnly && !passphrase)}
              onClick={this.handleExecute}
            >
              {isExecuting ? `${t('renewing')}...` : `${t('executeRenewals')} (${namesToRenew.length})`}
            </button>
          </div>
        )}
      </div>
    );
  }
}
