import React from 'react';
import PropTypes from 'prop-types';
import { useParams } from 'react-router-dom';

import Menu from 'components/Menu/Menu';
import Timeline from 'components/Timeline/Timeline';
import Ledger from 'components/Ledger/Ledger';

import { view as routerView } from 'lib/const'

import 'styles/Dapp.css';

/**
* @summary displays the contents of a poll
*/
const Layout = (props) => {
  const { dao, address, period } = useParams();

  // defaults
  let view = routerView.HOME;
  let renderAddress = props.address;

  // context specific
  if (dao) {
    renderAddress = dao; 
    view = routerView.DAO; 
  } else if (address) { 
    renderAddress = address; 
    view = routerView.ADDRESS; 
  } else if (period) { 
    view = routerView.PERIOD; 
  }

  console.log(`view: ${view}`);

  return (
    <div>
      <div id="app" className="app">
        <div id="menu" className="left">
          <Menu address={renderAddress} view={view} />
        </div>
        <div id="content" className="right">
          <div id="main-feed" className="split split-left split-landing">
            <div id="proposals" className="content content-feed max100">
              <div id="non-editable-feed">
                <Timeline address={renderAddress} view={view} field={'memberAddress'} first={25} skip={0} orderBy={'createdAt'} orderDirection={'desc'}  />
              </div>
            </div>
          </div>
          <div id="alternative-feed" className="split split-right split-landing">
            <Ledger address={renderAddress} view={view} />
          </div>
        </div>
      </div>
    </div>
  );
};

Layout.propTypes = {
  addresss: PropTypes.string,
};

export default Layout;

