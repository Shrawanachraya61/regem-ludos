const randomId = () => {
  return Math.random().toString(36).substr(2, 9);
};

const escapeString = (s: string) => {
  const lookup = {
    '&': '&amp;',
    '"': '&quot;',
    '<': '&lt;',
    '>': '&gt;',
  };
  return s.replace(/[&"<>]/g, c => lookup[c]);
};

const shuffle = (arr: any[]) => {
  const ret: any[] = [];
  const cp = [...arr];
  while (cp.length) {
    const i = Math.floor(Math.random() * cp.length);
    ret.push(cp[i]);
    cp.splice(i, 1);
  }
  return ret;
};
