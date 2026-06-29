import React, { Component } from 'react';
import Proptype from 'prop-types';
import HnsLogoClean from '../../assets/images/hns-logo-clean.png';
import Spinner from '../../assets/images/brick-loader.svg';
import dbClient from "../../utils/dbClient";
import Alert from "../Alert";
import {withRouter} from "react-router-dom";
import {connect} from "react-redux";
import {I18nContext} from "../../utils/i18n";
import {clientStub as nClientStub} from "../../background/node/client";
import {clientStub as cClientStub} from "../../background/connections/client";
import {ConnectionTypes} from "../../background/connections/service";
import "./splash-screen.scss"

const nodeClient = nClientStub(() => require('electron').ipcRenderer);
const connClient = cClientStub(() => require('electron').ipcRenderer);


class SplashScreen extends Component {
  static propTypes = {
    error: Proptype.string,
    network: Proptype.string,
    spv: Proptype.bool,
    compactingTree: Proptype.bool,
  };

  static defaultProps = {
    error: '',
  };

  static contextType = I18nContext;

  state = {
    hasMigrated400: false,
  };

  async switchToP2P() {
    await connClient.setConnectionType(ConnectionTypes.P2P);
    await nodeClient.reset();
  }

  async componentDidMount() {
    // TODO: `network` is ALWAYS 'main' here. I think that is because
    // this code runs before any of the background stuff has a chance
    // to update state with user's actual configuration. This is only an
    // issue for developers because we will see the splash screen for a moment
    // on every boot in regtest until state.network is updated.
    const {network, spv} = this.props;
    const migrateFlag = `${network}-hsd-4.0.0-migrate${spv ? '-spv' : ''}`;
    const hasMigrated400 = await dbClient.get(migrateFlag);
    this.setState({ hasMigrated400 });
  }

  render() {
    const {error} = this.props;
    const {t} = this.context;

    const isRpcError = error === 'RPC:ECONNREFUSED';

    return (
      <div style={wrapperStyle}>
        <div style={logoContainerStyle}>
          <img src={HnsLogoClean} style={logoStyle} alt="Handshake Wallet Logo" />
          <div style={titleStyle}>Handshake Wallet</div>
        </div>
        {
          error
            ?
            <>
              <div style={textStyles}>
                {isRpcError ? t('splashRpcError') : error}
              </div>
              {isRpcError &&
                <button
                  className="switch-p2p-button"
                  onClick={() => this.switchToP2P()}
                >
                  {t('splashSwitchToInternal')}
                </button>
              }
            </>
            : (
              <React.Fragment>
                <div style={spinnerStyle} />
                <div style={textStyles}>{t('splashLoading')}</div>
                { this.renderAlert(t) }
              </React.Fragment>
            )
        }
      </div>
    );
  }

  renderAlert(t) {
    // Tree compaction alert takes precedence
    if (this.props.compactingTree) {
      return (
        <Alert type="warning" style={alertStyle}>
          <div>
            {t('compactingTree1')}
          </div>
          <div>
            {t('compactingTree2')}
          </div>
        </Alert>
      );
    }

    if (!this.state.hasMigrated400) {
      return(
        <Alert type="warning" style={alertStyle}>
          <div>
            {
              // Technically the version is now 4.0.0 not 3.0.0
              // but the actual text in the message is version
              // agnostic ("migration in progress...")
              // so we can probably just leave this as is.
              t('splashMigrate3001')
            }
          </div>
          <div>
            {t('splashMigrate3002')}
          </div>
        </Alert>
      )
    }
  }
}

export default withRouter(
  connect(
    (state) => ({
      network: state.node.network,
      spv: state.node.spv,
      compactingTree: state.node.compactingTree,
    }),
  )(SplashScreen)
);

const wrapperStyle = {
  display: 'flex',
  flexFlow: 'column nowrap',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100vh',
  backgroundColor: '#0a0a0c', // Dark background for premium look
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const logoContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginBottom: '2.5rem',
};

const logoStyle = {
  height: '130px',
  width: '130px',
  marginBottom: '1.25rem',
  filter: 'drop-shadow(0 0 20px rgba(99, 232, 177, 0.15))', // Cyan/blue glow
};

const titleStyle = {
  fontSize: '2.25rem',
  fontWeight: '700',
  color: '#ffffff',
  letterSpacing: '-0.025em',
  textAlign: 'center',
  margin: '0',
};

const spinnerStyle = {
  backgroundImage: `url(${Spinner})`,
  marginBottom: '15px',
  height: '1.5rem',
  width: '1.5rem',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  animation: '0.5s ease-in-out',
  filter: 'invert(1) brightness(1.5)', // Invert spinner color for dark theme readability
};

const textStyles = {
  fontSize: '0.95rem',
  lineHeight: '1.5',
  color: '#a0a0ab', // Light gray for dark theme readability
  textAlign: 'center',
  maxWidth: '400px',
};

const alertStyle = {
  marginTop: '1rem',
  width: '24rem',
  textAlign: 'center',
};
