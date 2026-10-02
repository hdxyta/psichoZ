(() => {
  const milestones = {1:'knife',3:'shotgun',8:'staff'};
  const rank = {knife:1,shotgun:2,staff:3};
  window.AditivoWeapons = {
    dropForCards(count) { return milestones[count] || null; },
    collect(current, incoming) { return !current || rank[incoming]>rank[current] ? incoming : current; },
  };
})();
