function require (path) {
    // not EXACTLY like how node does it but more appropriate for the browser
    path = path.replace(/\/+/g, '/');
    
    var mod
        = require.modules[path]
        || require.modules[path.replace(/\.(js|coffee)$/, '')]
        || require.modules[(path + '/index').replace(/\/+/g, '/')]
    ;
    
    if (!mod) throw new Error("Cannot find module '" + path + "'");
    return mod._cached ? mod._cached : mod();
}

var _browserifyRequire = require; // scoping >_<

require.paths = [];
require.modules = {};

require.fromFile = function (filename, path) {
    // require a file with respect to a path
    var resolved = _browserifyRequire.resolve(filename, path);
    return _browserifyRequire(resolved);
};

require.resolve = function (basefile, file) {
    var basedir = basefile.match(/\//)
        ? basefile.replace(/[^\/]+$/, '')
        : basefile
    ;
    var pkg = file.split('/')[0];
    
    if (_browserifyRequire.modules[basefile + '/node_modules/' + file]) {
        return basefile + '/node_modules/' + file;
    }
    else if (_browserifyRequire.modules[
        basedir.replace(/\/$/, '') + '/node_modules/' + pkg
    ]) {
        return basedir.replace(/\/$/, '') + '/node_modules/' + pkg
    }
    else if (_browserifyRequire.modules[
        basedir.replace(/\/$/, '') + '/node_modules/' + pkg + '/index'
    ]) {
        return basedir.replace(/\/$/, '') + '/node_modules/' + pkg + '/index';
    }
    else if (_browserifyRequire.modules[
        basedir.replace(/\/$/, '') + '/node_modules/' + pkg + '/index.js'
    ]) {
        return basedir.replace(/\/$/, '') + '/node_modules/' + pkg + '/index.js';
    }
    else if (!file.match(/^[\.\/]/)) return file;
    else if (file.match(/^\//)) return file;
    
    if (basedir === '') {
        basedir = '.';
    }
    
    // normalize file path.
    var r1 = /[^\/.]+\/\.\./g;
    var r2 = /\/{2,}/g;
    for(
        var norm = file;
        norm.match(r1) != null || norm.match(r2) != null;
        norm = norm.replace(r1, '').replace(r2, '/')
    );
    
    while (norm.match(/^\.\.\//)) {
        if (basedir === '/' || basedir === '') {
            throw new Error("Couldn't resolve path"
                + "'" + file + "' with respect to filename '" + basefile + "': "
                + "file can't resolve past base"
            );
        }
        norm = norm.replace(/^\.\.\//, '');
        basedir = basedir.replace(/[^\/]+\/$/, '');
    }
    
    var n = basedir.match(/\//)
        ? basedir.replace(/[^\/]+$/,'') + norm
        : norm.replace(/^\.\//, basedir + '/');
    var res = n.replace(/\/.\//, '/');
    return res;
};
