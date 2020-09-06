import projectData from './project-data';

/* eslint-disable import/no-unresolved */
import popWav from '!arraybuffer-loader!./83a9787d4cb6f3b7632b4ddfebf74367.wav';
import meowWav from '!arraybuffer-loader!./83c36d806dc92327b9e7049a565c6bff.wav';
import backdrop from '!raw-loader!./cd21514d0531fdffb22204e0ec5ed84a.svg';
// import costume1 from '!raw-loader!./b7853f557e4426412e64bb3da6531a99.svg';
// import costume2 from '!raw-loader!./e6ddc55a6ddd9cc9d84fe0b4c21e016f.svg';
import triangle from '!raw-loader!./triangle.svg';
import plankton from '!raw-loader!./plankton2.svg';
import poison from '!raw-loader!./poison2.svg';
/* eslint-enable import/no-unresolved */

import md5 from 'js-md5';

const defaultProject = translator => {
    let _TextEncoder;
    if (typeof TextEncoder === 'undefined') {
        _TextEncoder = require('text-encoding').TextEncoder;
    } else {
        /* global TextEncoder */
        _TextEncoder = TextEncoder;
    }
    const encoder = new _TextEncoder();

    const projectJson = projectData(translator);
    return [{
        id: 0,
        assetType: 'Project',
        dataFormat: 'JSON',
        data: JSON.stringify(projectJson)
    }, {
        id: '83a9787d4cb6f3b7632b4ddfebf74367',
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(popWav)
    }, {
        id: '83c36d806dc92327b9e7049a565c6bff',
        assetType: 'Sound',
        dataFormat: 'WAV',
        data: new Uint8Array(meowWav)
    }, {
        id: 'cd21514d0531fdffb22204e0ec5ed84a',
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(backdrop)
    }, {
        id: md5(triangle),
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(triangle)
    }, {
        id: md5(plankton),
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(plankton)
    }, {
        id: md5(poison),
        assetType: 'ImageVector',
        dataFormat: 'SVG',
        data: encoder.encode(poison)
    }];
};

export default defaultProject;
