import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import log from '../lib/log.js';


import {connect} from 'react-redux';

import {defineMessages, intlShape, injectIntl} from 'react-intl';

import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';


import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';


/**
 * @since botch-0.2
 */
class BotchDebugTab extends React.Component {


    constructor (props) {
        super(props);
        bindAll(this, [
           
        ]);

    }

    /**
     * @since botch-0.2
     */
    componentDidMount () {
        log.log('Botch: botch-debug-tab ComponentDidMount');
    
    }

    /**
     * @since botch-0.2
     */
    componentWillUnmount () {
    }


    /**
     * @since botch-0.2
     * @returns {*} rendered component
     */
    render () {
        
        return <div>{`Debug`}</div>;
    }
}


BotchDebugTab.propTypes = {
    
            
    stage: PropTypes.shape({
        sounds: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired
        }))
    })
    
};

// https://react-redux.js.org/using-react-redux/connect-mapstate

const mapStateToProps = state => ({
    editingTarget: state.scratchGui.targets.editingTarget,
    isRtl: state.locales.isRtl,
    sprites: state.scratchGui.targets.sprites,
    stage: state.scratchGui.targets.stage
});

const mapDispatchToProps = dispatch => ({
    onActivateCostumesTab: () => dispatch(activateTab(COSTUMES_TAB_INDEX)),

    dispatchUpdateRestore: restoreState => {
        dispatch(setRestore(restoreState));
    },
    onCloseImporting: () => dispatch(closeAlertWithId('importingAsset')),
    onShowImporting: () => dispatch(showStandardAlert('importingAsset'))
});

// export default injectIntl(SpriteLibrary);

export default errorBoundaryHOC('BotchDebug Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(BotchDebugTab))
);
