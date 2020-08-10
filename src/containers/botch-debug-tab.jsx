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


import randomizeSpritePosition from '../lib/randomize-sprite-position';
// import spriteTags from '../lib/libraries/sprite-tags';

import BotchLifeTree from '../components/botch/botch-life-tree.jsx';

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
        id: 'gui.botchDebugTab.lifetree'
    }
});

class BotchDebugTab extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect'
        ]);

        this.state = {library_sprites: []};
    }

    componentDidMount () {
        this.updateSprites();
        this.props.vm.on('BOTCH_STORAGE_HELPER_UPDATE', this.updateSprites);
    }
    componentWillUnmount () {
        this.props.vm.removeListener('BOTCH_STORAGE_HELPER_UPDATE', this.updateSprites);
    }

    updateSprites (){
        if (!window.BOTCH){
            console.error('Botch extension is not loaded !');
            return;
        }
        BOTCH.storageHelper.load_library_sprites().then(library_sprites => {
            this.setState({library_sprites: library_sprites});
        });

    }

    getTags (){
        if (!window.BOTCH){
            console.error('Botch extension is not loaded !');
            return;
        }
        return BOTCH.storageHelper.get_all_tags();
    }

    handleSelect (index){
        // TODO DOES NOT SHOW ANYTHING !
        console.log(`Selected tab: ${index}`);
    }

    handleItemSelect (item) {
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item.json)).then(() => {
            console.log('Botch: should I do something now ?');
            // this.props.onActivateBlocksTab();
        });
    }

    render () {
        
        return (<BotchLifeTree
            data={this.state.library_sprites}
            id="botchLifeTree"
            tags={this.getTags()}
            title={this.props.intl.formatMessage(messages.libraryTitle)}
            onItemSelected={this.handleItemSelect}
            onRequestClose={() => console.log('Botch: I should close..')}
        />);
        /* (
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

{ /* <svg width={90} height={90}>
    <image xlinkHref={this.getCostume()} width={90} height={90} />
</svg> */ }


BotchDebugTab.propTypes = {
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

export default errorBoundaryHOC('BotchDebug Tab')(
    injectIntl(connect(
        mapStateToProps,
        mapDispatchToProps
    )(BotchDebugTab))
);
