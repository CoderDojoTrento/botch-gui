import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import VM from 'scratch-vm';
import log from '../lib/log.js';

import {connect} from 'react-redux';

import {defineMessages, intlShape, injectIntl} from 'react-intl';

import errorBoundaryHOC from '../lib/error-boundary-hoc.jsx';


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

/* global BOTCH */

class BotchDebugTab extends React.Component {
    /**
     * Given a name and a list of existing names, if name is in the list
     * generates a new name appending numbers to it.
     *
     * @param {string} name name to test
     * @param {Set<string>} names a set of existing names.
     * @returns {string} the new candidate name
     * @since botch-0.2
     */
    static findNewName (name, names){
        let candidate = name;
        let i = 1;
        while (names.has(candidate)) {
            const last = candidate[candidate.length - 1];
            
            if (last >= '0' && last < '9' && i < 10){
                candidate = candidate.slice(0, candidate.length - 1) + i;
                i += 1;
            } else {
                i = 1;
                const n = (last >= '0' && last <= '9') ? '0' : ' 1';
                candidate = `${candidate}${n}`;
            }
        }
        
        return candidate;
    }
    
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleItemSelect',
            'updateSprites'
        ]);

        this.state = {librarySprites: []};
    }

    componentDidMount () {
        log.log('Botch: botch-debug-tab ComponentDidMount');
        this.updateSprites();
        this.props.vm.on('BOTCH_STORAGE_HELPER_UPDATE', this.updateSprites);
    }
    componentWillUnmount () {
        log.log('Botch: botch-debug-tab ComponentWillUnmount');
        this.props.vm.removeListener('BOTCH_STORAGE_HELPER_UPDATE', this.updateSprites);
    }
    

    updateSprites (){
        
        log.log('Botch: botch-debug-tab updateSprites. this=', this);
        if (!window.BOTCH){
            log.error('Botch extension is not loaded !');
            return;
        }
        
        // log.log('this=', this);
        BOTCH.loadLibrarySprites().then(librarySprites => {
            const names = new Set();
            for (const libSprite of librarySprites){
                const candidate = BotchDebugTab.findNewName(libSprite.name, names);
                libSprite.name = candidate;
                libSprite.json.name = candidate;
                libSprite.json.objName = candidate;
                names.add(candidate);
            }
            
            this.setState({librarySprites: librarySprites});
        });

    }

    getTags (){
        if (!window.BOTCH){
            log.error('Botch extension is not loaded !');
            return;
        }
        return BOTCH.storageHelper.getAllTags();
    }

    handleSelect (index){
        // TODO DOES NOT SHOW ANYTHING !
        log.log(`Selected tab: ${index}`);
    }

    handleItemSelect (item) {
        // Randomize position of library sprite
        randomizeSpritePosition(item);
        this.props.vm.addSprite(JSON.stringify(item.json)).then(() => {
            log.log('Botch: should I do something now ?');
            // this.props.onActivateBlocksTab();
        });
    }

    requestClose (){
        log.log('Should I do something on close ?');
    }

    render () {
        
        return (<BotchLifeTree
            data={this.state.librarySprites}
            id="botchLifeTree"
            tags={this.getTags()}
            title={this.props.intl.formatMessage(messages.libraryTitle)}
            onItemSelected={this.handleItemSelect}
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


BotchDebugTab.propTypes = {
    dispatchUpdateRestore: PropTypes.func,
    editingTarget: PropTypes.string,
    intl: intlShape.isRequired,
    isRtl: PropTypes.bool,
    onActivateBlocksTab: PropTypes.func,
    onCloseImporting: PropTypes.func.isRequired,
    
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
