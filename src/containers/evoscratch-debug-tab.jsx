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

import spriteLibraryContent from '../lib/libraries/sprites.json';
import randomizeSpritePosition from '../lib/randomize-sprite-position';
import spriteTags from '../lib/libraries/sprite-tags';

import EvoScratchLifeTree from '../components/evoscratch/evoscratch-life-tree.jsx';

import {
    activateTab,
    COSTUMES_TAB_INDEX
} from '../reducers/editor-tab';

import {setRestore} from '../reducers/restore-deletion';
import {showStandardAlert, closeAlertWithId} from '../reducers/alerts';

const messages = defineMessages({
    libraryTitle: {
        defaultMessage: 'Choose a Sprite',
        description: 'Heading for the sprite library',
        id: 'gui.evoscratchDebugTab.lifetree'
    }
});


class EvoScratchDebugTab extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect'
        ]);
        // this.state = {selectedSoundIndex: 0};
  
        console.log(props);
    }

    handleItemSelect (item) {
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item.json)).then(() => {
            console.log("I should do something now ...")
            //this.props.onActivateBlocksTab();
        });
    }

    render() {
        
        return <EvoScratchLifeTree
                data={spriteLibraryContent}
                id="evoscratchLifeTree"
                tags={spriteTags}
                title={this.props.intl.formatMessage(messages.libraryTitle)}
                onItemSelected={this.handleItemSelect}
                onRequestClose= { () => console.log("I should close..")}
                // onRequestClose={this.props.onRequestClose}
            />
        /*( 
            <canvas
                id="orgCanvas"
                width={400} 
                height={400} 
                style={{border: '1px solid black', backgroundColor: 'white'}}
                onClick={this.showCostume}>
            </canvas>            
        );*/
    }
}

{/* <svg width={90} height={90}>       
    <image xlinkHref={this.getCostume()} width={90} height={90} />    
</svg> */}




EvoScratchDebugTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    onActivateBlocksTab: PropTypes.func,
    onActivateCostumesTab: PropTypes.func.isRequired,
    onCloseImporting: PropTypes.func.isRequired,
    onRequestClose: PropTypes.func,
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

// export default injectIntl(SpriteLibrary);

export default errorBoundaryHOC('EvoScratchDebug Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(EvoScratchDebugTab))
);
