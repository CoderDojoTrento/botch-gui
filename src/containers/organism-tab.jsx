import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import Renderer from 'scratch-render';
import VM from 'scratch-vm';
import {connect} from 'react-redux';

import {defineMessages, intlShape, injectIntl} from 'react-intl';


import {handleFileUpload} from '../lib/file-uploader.js';
import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';
import DragConstants from '../lib/drag-constants';
import downloadBlob from '../lib/download-blob';

import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

import Prova from '../components/aaaa/aaa.jsx'

class OrganismTab extends React.Component {
    constructor (props) {
        super(props);
        this.getCostume = this.getCostume.bind(this);
        this.showCostume = this.showCostume.bind(this);
        // this.state = {selectedSoundIndex: 0};
  
        console.log(props);
    }

    getCostume() {
        const target = this.props.editingTarget;
        const iconMd5 = this.props.sprites[target].costume.md5;
        return `https://cdn.assets.scratch.mit.edu/internalapi/asset/${iconMd5}/get/`;
    }

    showCostume() {
        const canvas = document.getElementById('orgCanvas');
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = "white";
        var image = new Image();
        image.onload = function(){
            ctx.drawImage(this, 0,0);
        }
        image.src = this.getCostume();
    }

    render() {
        return( 
            <canvas
                id="orgCanvas"
                width={400} 
                height={400} 
                style={{border: '1px solid black', backgroundColor: 'white'}}
                onClick={this.showCostume}>
            </canvas>            
        );
    }
}

{/* <svg width={90} height={90}>       
    <image xlinkHref={this.getCostume()} width={90} height={90} />    
</svg> */}

OrganismTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape,
    isRtl: PropTypes.bool,
    onActivateCostumesTab: PropTypes.func.isRequired,
    onCloseImporting: PropTypes.func.isRequired,
    onRequestCloseSoundLibrary: PropTypes.func.isRequired,
    onShowImporting: PropTypes.func.isRequired,
    soundLibraryVisible: PropTypes.bool,
    soundRecorderVisible: PropTypes.bool,
    stage: PropTypes.shape({
        sounds: PropTypes.arrayOf(PropTypes.shape({
            name: PropTypes.string.isRequired
        }))
    }),
    vm: PropTypes.instanceOf(VM).isRequired
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
    onNewSoundFromLibraryClick: e => {
        e.preventDefault();
        dispatch(openSoundLibrary());
    },
    onNewSoundFromRecordingClick: () => {
        dispatch(openSoundRecorder());
    },
    onRequestCloseSoundLibrary: () => {
        dispatch(closeSoundLibrary());
    },
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
