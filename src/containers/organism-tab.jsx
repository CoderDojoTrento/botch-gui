import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import log from '../lib/log.js';
import {injectIntl} from 'react-intl';


import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';

import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';


class OrganismTab extends React.Component {
    constructor (props) {
        super(props);
        this.getCostume = this.getCostume.bind(this);
        this.showCostume = this.showCostume.bind(this);
        // this.state = {selectedSoundIndex: 0};
  
        log.log(props);
    }

    getCostume () {
    }

    handleCostume () {

    }

    render () {
        return (
            <canvas
                id="orgCanvas"
                width={400}
                height={400}
                style={{border: '1px solid black', backgroundColor: 'white'}}
                onClick={this.handleCostume}
            />
        );
    }
}


OrganismTab.propTypes = {
    
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

export default errorBoundaryHOC('Organism Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(OrganismTab))
);
