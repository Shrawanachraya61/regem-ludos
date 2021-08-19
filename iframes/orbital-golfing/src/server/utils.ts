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
