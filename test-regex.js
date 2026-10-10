const desc = 'Original desc\n---DEAL_META---\n{"owner":"RA"}\n---DEAL_META---\n{"owner":"RA"}';
const match = desc.match(/---DEAL_META---\n(.*)/);
console.log('Match:', match ? match[1] : null);
