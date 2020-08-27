import classNames from 'classnames';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';
import {defineMessages, injectIntl, intlShape} from 'react-intl';

import Divider from '../divider/divider.jsx';
import Filter from '../filter/filter.jsx';
import TagButton from '../../containers/tag-button.jsx';
import Spinner from '../spinner/spinner.jsx';

import styles from './botch-life-tree.css';
import BotchLifeTreeItem from './botch-life-tree-item.jsx';
import log from '../../lib/log.js';

const messages = defineMessages({
    filterPlaceholder: {
        id: 'gui.library.filterPlaceholder',
        defaultMessage: 'Search',
        description: 'Placeholder text for library search field'
    },
    allTag: {
        id: 'gui.library.allTag',
        defaultMessage: 'All',
        description: 'Label for library tag to revert to all items after filtering by tag.'
    }
});

const ALL_TAG = {tag: 'all', intlLabel: messages.allTag};
const tagListPrefix = [ALL_TAG];


class BotchLifeTree extends React.Component {

    
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClose',
            'handleFilterChange',
            'handleFilterClear',
            'handleMouseEnter',
            'handleMouseLeave',
            'handlePlayingEnd',
            'handleSelect',
            'handleTagClick',
            'setFilteredDataRef'
        ]);
        log.log('Botch props=', props);
        this.state = {
            playingItem: null,
            filterQuery: '',
            selectedTag: ALL_TAG.tag,
            loaded: false
        };
        this.initLayout(this.state);
    }
    componentDidMount () {
        // Allow the spinner to display before loading the content
        setTimeout(() => {
            const s = {loaded: true};
            this.initLayout(s);
            this.setState(s);
            
        });
        if (this.props.setStopHandler) this.props.setStopHandler(this.handlePlayingEnd);
    }
    componentDidUpdate (prevProps, prevState) {
        if (prevState.filterQuery !== this.state.filterQuery ||
            prevState.selectedTag !== this.state.selectedTag) {
            this.scrollToTop();
        }
    }
    handleSelect (id) {
        this.handleClose();
        this.props.onItemSelected(this.getFilteredData()[id]);
    }
    handleClose () {
        
    }
    handleTagClick (tag) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: '',
                selectedTag: tag.toLowerCase()
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredLayout()[this.state.playingItem]);
            this.setState({
                filterQuery: '',
                playingItem: null,
                selectedTag: tag.toLowerCase()
            });
        }
    }
    handleMouseEnter (id) {
        // don't restart if mouse over already playing item
        if (this.props.onItemMouseEnter && this.state.playingItem !== id) {
            this.props.onItemMouseEnter(this.getFilteredData()[id]);
            this.setState({
                playingItem: id
            });
        }
    }
    handleMouseLeave (id) {
        if (this.props.onItemMouseLeave) {
            this.props.onItemMouseLeave(this.getFilteredData()[id]);
            this.setState({
                playingItem: null
            });
        }
    }
    handlePlayingEnd () {
        if (this.state.playingItem !== null) {
            this.setState({
                playingItem: null
            });
        }
    }
    handleFilterChange (event) {
        if (this.state.playingItem === null) {
            this.setState({
                filterQuery: event.target.value,
                selectedTag: ALL_TAG.tag
            });
        } else {
            this.props.onItemMouseLeave(this.getFilteredData()[this.state.playingItem]);
            this.setState({
                filterQuery: event.target.value,
                playingItem: null,
                selectedTag: ALL_TAG.tag
            });
        }
    }
    handleFilterClear () {
        this.setState({filterQuery: ''});
    }
    getFilteredLayout () {
        log.log('Botch TODO, not actually filtering anything !');
        return this.state.layout;
        /*
        if (this.state.selectedTag === 'all') {
            if (!this.state.filterQuery) {
                return this.props.data;
            }
            return this.props.data.filter(dataItem => (
                (dataItem.tags || [])
                    // Second argument to map sets `this`
                    .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                    .concat(dataItem.name ?
                        (typeof dataItem.name === 'string' ?
                        // Use the name if it is a string, else use formatMessage to get the translated name
                            dataItem.name : this.props.intl.formatMessage(dataItem.name.props)
                        ).toLowerCase() :
                        null)
                    .join('\n') // unlikely to partially match newlines
                    .indexOf(this.state.filterQuery.toLowerCase()) !== -1
            ));
        }
        return this.props.data.filter(dataItem => (
            dataItem.tags &&
            dataItem.tags
                .map(String.prototype.toLowerCase.call, String.prototype.toLowerCase)
                .indexOf(this.state.selectedTag) !== -1
        ));
        */
    }
    
    scrollToTop () {
        this.filteredDataRef.scrollTop = 0;
    }
    setFilteredDataRef (ref) {
        this.filteredDataRef = ref;
    }

    getViewBox (){
        const vb = this.state.viewBox;
        return [vb.x, vb.y, vb.width, vb.height].join(' ');
    }
    renderTree (){

        const connectorStyle = {fill: 'lime', stroke: 'purple', strokeWidth: 5, fillRule: 'nonzero'};

        const vp = this.state.viewport;
        const m = this.state.measures;
        
        const fl = this.getFilteredLayout();

        return (
            <svg
                width={vp.width}
                height={vp.height}
                viewBox={this.getViewBox()}

                style={{border: '1px', red: 'solid'}}
            >
                {Object.keys(fl).forEach(key => (
                    <g
                        transform={`translate(${fl[key].xoff},${fl[key].yoff})`}
                        key={typeof fl[key].name === 'string' ? fl[key].name : fl[key].rawURL}
                    >
                                                                        
                        <polygon
                            points="100,10 40,198 190,78 10,78 160,198"
                            style={connectorStyle}
                        />
                                
                        <foreignObject
                            width={m.nodew}
                            height={m.nodeh}
                        >
                            {this.renderTreeItem(fl[key])}
                        </foreignObject>
                        
                    </g>))}
            </svg>
        );
    }

    renderTreeContainer (){
        const LOADED = this.renderTree();

        return (<div
            className={classNames(styles.libraryScrollGrid, {
                [styles.withFilterBar]: this.props.filterable || this.props.tags
            })}
            ref={this.setFilteredDataRef}
        >
            {this.state.loaded ? <span>{LOADED}</span> : (
                <div className={styles.spinnerWrapper}>
                    <Spinner
                        large
                        level="primary"
                    />
                </div>
            )}
        </div>);
    }

    renderTreeItem (dataItem){
        return (<BotchLifeTreeItem
            bluetoothRequired={dataItem.bluetoothRequired}
            collaborator={dataItem.collaborator}
            description={dataItem.description}
            disabled={dataItem.disabled}
            extensionId={dataItem.extensionId}
            featured={dataItem.featured}
            hidden={dataItem.hidden}
            
            // Botch: our sprite md5 can be different from first costume
            // iconMd5={dataItem.md5}
            iconMd5={(dataItem.json && dataItem.json.costumes[0]) ?
                dataItem.json.costumes[0].md5ext : dataItem.md5}
            iconRawURL={dataItem.rawURL}
            icons={dataItem.json && dataItem.json.costumes}
            id={dataItem.md5}
            insetIconURL={dataItem.insetIconURL}
            internetConnectionRequired={dataItem.internetConnectionRequired}
            isPlaying={this.state.playingItem === dataItem.md5}
            name={dataItem.name}
            showPlayButton={this.props.showPlayButton}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            onSelect={this.handleSelect}
        />);
    }

    renderFilter (){
        return (this.props.filterable || this.props.tags) && (
            <div className={styles.filterBar}>
                {this.props.filterable && (
                    <Filter
                        className={classNames(
                            styles.filterBarItem,
                            styles.filter
                        )}
                        filterQuery={this.state.filterQuery}
                        inputClassName={styles.filterInput}
                        placeholderText={this.props.intl.formatMessage(messages.filterPlaceholder)}
                        onChange={this.handleFilterChange}
                        onClear={this.handleFilterClear}
                    />
                )}
                {this.props.filterable && this.props.tags && (
                    <Divider className={classNames(styles.filterBarItem, styles.divider)} />
                )}
                {this.props.tags &&
                    <div className={styles.tagWrapper}>
                        {tagListPrefix.concat(this.props.tags).map((tagProps, id) => (
                            <TagButton
                                active={this.state.selectedTag === tagProps.tag.toLowerCase()}
                                className={classNames(
                                    styles.filterBarItem,
                                    styles.tagButton,
                                    tagProps.className
                                )}
                                key={`tag-button-${id}`}
                                onClick={this.handleTagClick}
                                {...tagProps}
                            />
                        ))}
                    </div>
                }
            </div>
        );
    }


    /**
     *
     *
     * @param {*} state pass state so linter does not complain
     * @since botch-0.2
     */
    initLayout (state){

        const vp = { // occupied screen
            width: 500,
            height: 500};

        state.viewport = vp;
    
        state.viewBox = {
            x: -vp.width / 2,
            y: 0,
            width: vp.width,
            height: vp.height
        };

        state.measures = {
            deltah: 15,
            deltaw: 25,
            nodeh: 150,
            nodew: 100
        };
        const m = state.measures;
        
        m.levh = (m.deltah * 2) + m.nodeh;

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
        state.layout = layout;

        if (!this.props.data){
            return;
        }

        for (const libSprite of this.props.data){

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
        
        log.log('Botch: this.props.data', this.props.data);
        log.log('Botch: layout =', layout);
        const stack1 = [layout.parent_0];
        

        const generations = [1];

        while (stack1.length !== 0){
            const node = stack1.pop();
            log.log('node = ', node);
            for (const child of node.children){
                if (node.expanded){
                    child.visible = true;
                } else {
                    child.visible = false;
                }
                if (node.generation + 1 < generations.length){
                    generations[node.generation + 1] += node.children.length;
                } else {
                    generations.push(node.children.length);
                }
                child.generation = node.generation + 1;
                
                stack1.push(child);
            }
        }

        const queue = [p0];
        let curGen = 0;
        let i = 0;
        m.toth = ((generations.length - 1) * m.levh) + m.nodeh;
        while (queue.length !== 0){
            const node = queue.shift();
            if (node.generation > curGen){
                curGen = node.generation;
                i = 0;
            }
            const levw = generations[node.generation] * (m.nodew + (m.deltaw * 2));
            node.x = (-levw / 2) + ((m.nodew + (m.deltaw * 2)) * i) - (m.nodew / 2);
            node.xoff = node.x - (m.nodew / 2);
            node.y = m.toth - m.nodeh - (m.levh * curGen) + (m.nodeh / 2);
            node.yoff = node.y - (m.nodeh / 2);
        }

        
    }


    render () {
        return (
        /*
        <Modal
            fullScreen
            contentLabel={this.props.title}
            id={this.props.id}
            onRequestClose={this.handleClose}
        >*/
            <div>
                {this.renderTreeContainer()}
            </div>
        );
    }
}

BotchLifeTree.propTypes = {
    data: PropTypes.arrayOf(
        /* eslint-disable react/no-unused-prop-types, lines-around-comment */
        // An item in the library
        PropTypes.shape({
            // @to do remove md5/rawURL prop from library, refactor to use storage
            md5: PropTypes.string,
            name: PropTypes.oneOfType([
                PropTypes.string,
                PropTypes.node
            ]),
            rawURL: PropTypes.string
        })
        /* eslint-enable react/no-unused-prop-types, lines-around-comment */
    ),
    filterable: PropTypes.bool,
    id: PropTypes.string.isRequired,
    intl: intlShape.isRequired,
    onItemMouseEnter: PropTypes.func,
    onItemMouseLeave: PropTypes.func,
    onItemSelected: PropTypes.func,
    setStopHandler: PropTypes.func,
    showPlayButton: PropTypes.bool,
    tags: PropTypes.arrayOf(PropTypes.shape(TagButton.propTypes)),
    title: PropTypes.string.isRequired
};

BotchLifeTree.defaultProps = {
    filterable: true,
    showPlayButton: false
};

export default injectIntl(BotchLifeTree);
