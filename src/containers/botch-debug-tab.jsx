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
     *
     *
     * @param {*} state pass state so linter does not complain
     * @since botch-0.2
     */
    static calcLayout (viz, libSprites){
        
        const vp = viz.viewport;
        const m = viz.measures;

        const layout = {};
        

        // fictitious node, outside viewport on purpose
        const p0 = {};
        
        p0.generation = 0;
        p0.children = [];
        p0.md5 = 'parent_0';
        p0.parentId = ''; // very special case
        p0.expanded = true;
        p0.visible = false;
        p0.x = -vp.width / 2;
        p0.y = vp.height + m.deltah + (m.nodeh / 2);
        p0.xoff = p0.x - (m.nodew / 2);
        p0.yoff = p0.y - (m.nodeh / 2);
        layout.parent_0 = p0;

        if (!libSprites){
            return;
        }

        for (const libSprite of libSprites){

            if (!(libSprite.md5 in layout)){
                layout[libSprite.md5] = {
                    children: []
                };
            }
            const laySprite = layout[libSprite.md5];

            for (const key in libSprite){
                laySprite[key] = libSprite[key];
            }

            if (!libSprite.parentId){ // for copy-pasted default scratch sprites
                laySprite.parentId = 'parent_0';
            }
                                    
            if (!(laySprite.parentId in layout)){
                layout[laySprite.parentId] = {
                    children: []
                };
            }
            layout[laySprite.parentId].children.push(laySprite);
        }
        
        log.log('Botch: libSprites', libSprites);
        log.log('Botch: layout =', layout);
        const stack1 = [layout.parent_0];
        

        const generations = [1];

        while (stack1.length !== 0){
            const node = stack1.pop();
            log.log('node = ', node);

            if (node.generation + 1 < generations.length){
                generations[node.generation + 1] += node.children.length;
            } else if (node.children.length > 0){
                generations.push(node.children.length);
            }
            for (const child of node.children){
                if (node.expanded){
                    child.visible = true;
                } else {
                    child.visible = false;
                }
                child.generation = node.generation + 1;
                
                stack1.push(child);
            }
        }

        const queue = [p0];
        let curGen = 0;
        let i = 0;
        m.toth = ((generations.length - 1) * m.levh) + m.nodeh;
        log.log('measures=', m);
        log.log('generations=', generations);
        while (queue.length > 0){
            const node = queue.shift();
            if (node.generation > curGen){
                curGen = node.generation;
                i = 0;
            } else {
                i += 1;
            }
            if (node.generation > 0){
                const levw = generations[node.generation] * (m.nodew + (m.deltaw * 2));
                node.x = (-levw / 2) + ((m.nodew + (m.deltaw * 2)) * i) - (m.nodew / 2) - m.deltaw;
                node.xoff = node.x - (m.nodew / 2);
                node.y = vp.height - (m.nodeh + (m.levh * (curGen - 1)) - (m.nodeh / 2));
                node.yoff = node.y - (m.nodeh / 2);
            }
            for (const child of node.children){
                queue.push(child);
            }
            
        }
        return layout;
    }
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

        const viz = {};
        const vp = { // occupied screen
            width: 500,
            height: 500};

        viz.viewport = vp;
    
        viz.viewBox = {
            x: -vp.width / 2,
            y: 0,
            width: vp.width,
            height: vp.height
        };

        viz.measures = {
            deltah: 15,
            deltaw: 25,
            nodeh: 150,
            nodew: 100
        };
        const m = viz.measures;
        
        m.levh = (m.deltah * 2) + m.nodeh;

        this.state = {
            libSprites: [],
            layout: {},
            viz: viz};
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
        BOTCH.loadLibrarySprites().then(libSprites => {
            const names = new Set();
            for (const libSprite of libSprites){
                const candidate = BotchDebugTab.findNewName(libSprite.name, names);
                libSprite.name = candidate;
                libSprite.json.name = candidate;
                libSprite.json.objName = candidate;
                names.add(candidate);
            }
            log.log('Setting state:', libSprites);
            this.setState({
                libSprites: libSprites,
                layout: BotchDebugTab.calcLayout(this.state.viz, libSprites)});
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
        // TO DO DOES NOT SHOW ANYTHING !
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
            layout={this.state.layout}
            viz={this.state.viz}
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
