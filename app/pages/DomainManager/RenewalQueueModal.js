import React, { Component } from 'react';
import PropTypes from "prop-types";
import { connect } from 'react-redux';
import MiniModal from '../../components/Modal/MiniModal';
import { showError, showSuccess } from '../../ducks/notifications';
import { sendRenewal } from "../../ducks/names";
import { I18nContext } from "../../utils/i18n";
import Alert from "../../components/Alert";
import Submittable from '../../components/Submittable';
import c from 'classnames';

@connect(
  (state) => ({
    network: state.wallet.network,
    wid: state.wallet.wid,
    watchOnly: state.wallet.watchOnly,
  }),
  (dispatch) => ({
    showSuccess: (message) => dispatch(showSuccess(message)),
    showError: (message) => dispatch(showError(message)),
    sendRenewal: (name, passphrase) => dispatch(sendRenewal(name, passphrase)),
  }),
)
export default class RenewalQueueModal extends Component {
  static propTypes = {
    onClose: PropTypes.func.isRequired,
    selectedNames: PropTypes.array.isRequired,
    watchOnly: PropTypes.bool.isRequired,
    wid: PropTypes.string.isRequired,
    sendRenewal: PropTypes.func.isRequired,
    showSuccess: PropTypes.func.isRequired,
    showError: PropTypes.func.isRequired,
  };

  static contextType = I18nContext;

  constructor(props) {
    super(props);
    this.state = {
      passphrase: '',
      statusMap: props.selectedNames.reduce((acc, name) => {
        acc[name] = { status: 'waiting', error: null };
        return acc;
      }, {}),
      isExecuting: false,
      hasStarted: false,
      errorMessage: '',
    };
  }

  handleExecute = async () => {
    const { selectedNames, watchOnly } = this.props;
    const { passphrase } = this.state;
    const { t } = this.context;

    if (!watchOnly && !passphrase) {
      this.setState({ errorMessage: t('invalidPassword') || 'Password is required' });
      return;
    }

    this.setState({
      isExecuting: true,
      hasStarted: true,
      errorMessage: '',
    });

    for (const name of selectedNames) {
      this.setState(prevState => ({
        statusMap: {
          ...prevState.statusMap,
          [name]: { status: 'processing', error: null }
        }
      }));

      try {
        await this.props.sendRenewal(name, passphrase);
        this.setState(prevState => ({
          statusMap: {
            ...prevState.statusMap,
            [name]: { status: 'success', error: null }
          }
        }));
      } catch (e) {
        this.setState(prevState => ({
          statusMap: {
            ...prevState.statusMap,
            [name]: { status: 'failed', error: e.message }
          }
        }));
      }
    }

    this.setState({
      isExecuting: false,
      passphrase: '',
    });
  };

  renderStatusText(item) {
    const { t } = this.context;
    if (item.status === 'waiting') {
      return t('renewStatusWaiting');
    }
    if (item.status === 'processing') {
      return t('renewStatusProcessing');
    }
    if (item.status === 'success') {
      return t('renewStatusSuccess');
    }
    if (item.status === 'failed') {
      return t('renewStatusFailed', item.error);
    }
    return '';
  }

  render() {
    const { selectedNames, watchOnly } = this.props;
    const { passphrase, statusMap, isExecuting, hasStarted, errorMessage } = this.state;
    const { t } = this.context;

    return (
      <MiniModal
        title={t('renewalQueue')}
        onClose={isExecuting ? null : this.props.onClose}
        centered
      >
        <div className="renewal-queue-container">
          {errorMessage && <Alert type="error" message={errorMessage} />}
          
          <div className="renewal-queue">
            {selectedNames.map(name => {
              const item = statusMap[name];
              return (
                <div key={name} className="renewal-queue__item">
                  <div className="renewal-queue__item__name">{name}</div>
                  <div className={c(
                    'renewal-queue__item__status',
                    `renewal-queue__item__status--${item.status}`
                  )}>
                    {this.renderStatusText(item)}
                  </div>
                </div>
              );
            })}
          </div>

          {!watchOnly && !hasStarted && (
            <div className="renewal-queue__password-container">
              <div className="renewal-queue__input-label">{t('renewPasswordPrompt')}</div>
              <div className="renewal-queue__password-input">
                <Submittable onSubmit={this.handleExecute}>
                  <input
                    type="password"
                    placeholder="Your password"
                    onChange={e => this.setState({ passphrase: e.target.value, errorMessage: '' })}
                    value={passphrase}
                    disabled={isExecuting}
                    autoFocus
                  />
                </Submittable>
              </div>
            </div>
          )}

          <div className="renewal-queue__actions">
            {!hasStarted ? (
              <button
                disabled={isExecuting || (!watchOnly && !passphrase)}
                onClick={this.handleExecute}
              >
                {t('executeRenewals')}
              </button>
            ) : (
              <button
                disabled={isExecuting}
                onClick={this.props.onClose}
              >
                {t('close') || 'Close'}
              </button>
            )}
          </div>
        </div>
      </MiniModal>
    );
  }
}
