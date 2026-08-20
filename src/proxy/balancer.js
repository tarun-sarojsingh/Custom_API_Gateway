const clusterState = new Map();

function getTargetUrl(cluster) {
    if (!cluster || !cluster.instances || cluster.instances.length === 0) {
        throw new Error('No instances available in cluster');
    }

    const instances = cluster.instances;
    
    // Default to round-robin
    if (!clusterState.has(cluster.name)) {
        clusterState.set(cluster.name, { index: 0 });
    }

    const state = clusterState.get(cluster.name);
    
    const target = instances[state.index];
    
    state.index = (state.index + 1) % instances.length;
    
    return target;
}

module.exports = {
    getTargetUrl
};
