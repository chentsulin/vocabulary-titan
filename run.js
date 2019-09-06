module.exports = function run(fn) {
  return async function Run(context) {
    let nextDialog = fn;

    do {
      // TODO: improve this debug helper
      console.log(`Current Dialog: ${nextDialog.name || 'Anonymous'}`);
      // eslint-disable-next-line no-await-in-loop
      nextDialog = await nextDialog(context);
    } while (typeof nextDialog === 'function');
  };
}