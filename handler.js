const {
  FetchCambridge,
} = require('./lib/cambridge');
const {
  FetchDictionaryCom,
} = require('./lib/dictionary_com');
const cache = require('./lib/cache');
const diagnostic = require('./lib/diagnostic');

function replyText(message) {
  return async function ReplyText(context) {
    if (context.platform == 'line') {
      await context.replyText(message);
    } else if (context.platform == 'telegram') {
      await context.sendMessage(message);
    } else {
      await context.sendText(message);
    }
  };
}

function Greeting() {
  const GREETING_MSG = `Hi, this is Vocabulary Titan.
Please enter a word to start to search.

Engineer: 劉安齊 Liu, An-Chi
https://tigercosmos.xyz/
Designer: 簡嘉彤 Jian, Jia-Tong
https://www.instagram.com/atong_jtj/
`;

  return replyText(GREETING_MSG);
}

function Diagnose() {
  const mem = process.memoryUsage();
    const report = `Memory used: ${mem.rss / 1000000} MB
Hit rate: ${diagnostic.hitRate}`;
    
    return replyText(report);
}

function HandleNumber(context) {
  const data = cache.get(context.state.word);

  if (context.state.word == '' || data === undefined) {
    return replyText('Please enter new word.');
  } 

  switch (text) {
    case '1':
      return replyText(data.word + '\n---\n' + data.cambridge);
    case '2':
      const result2 = data.word + '\n' + (data.dictionary.length < 1970 ? data.dictionary : data.dictionary.slice(0, 1970) + '... (too much) :p');
      return replyText(result2);
    case '3':
      if (data.synonym == '') {
        return replyText(data.word + ': no synonym');
      } 
      const result3 = data.word + '\n' + (data.synonym.length < 1970 ? data.synonym : data.synonym.slice(0, 1970) + '... (too much) :p');
      return replyText(result3);
    case '4':
      const result4 = data.word + '\n' + (data.origin.length < 1970 ? data.origin : data.origin.slice(0, 1970) + '... (too much) :p');
      return replyText(result4);
    default:
      return replyText('Enter number 1 to 4');
  }
}

async function SearchWord(context) {
  const {
    text
  } = context.event.message;

  const word = text.trim().toLowerCase();

  let result = '';
  let data = {
    word,
    cambridge: '',
    dictionary: '',
    synonym: '',
    origin: '',
  };

  if (cache.get(word) === undefined) {

    diagnostic.miss();

    try {
      const cambridgeResult = await FetchCambridge(word);
      data.cambridge = cambridgeResult.result;
    } catch (err) {
      console.log(err);
      data.cambridge = `!! ${err}\n`;
    }
    try {
      const dicRes = await FetchDictionaryCom(word);
      data.dictionary = dicRes.result;
      data.synonym = dicRes.synonym;
      data.origin = dicRes.origin;
    } catch (err) {
      console.log(err);
      data.dictionary = `!! ${err}\n`;
    }
    cache.set(word, data);
    result = makeResult(data);
  } else {
    diagnostic.hit();
    result = makeResult(cache.get(word));
  }

  // store in session
  context.setState({
    word,
  });

  console.log('word:', word, ', total length: ', result.length);
  const mem = process.memoryUsage();
  console.log('Memory used: %d MB', mem.rss / 1000000);
  console.log('Hit Rate: %f', diagnostic.hitRate);

  return replyText(result);
}

async function HandleText(context) {
  const {
    text
  } = context.event.message;

  if (/^h(ello|i)|^\/start/i.test(text)) {
    return Greeting;
  } 
  
  if (text == '@@@') {
    return Diagnose;
  } 
  
  if (/^\d$/.test(text)) {
    return HandleNumber;
  } 
  
  if (/^[a-zA-Z\s-]+$/.test(text)) {
    return SearchWord;
  } 
    
  return replyText('Wrong Input!');
}

function Main(context) {
  if (context.event.isFollow || context.event.isJoin) {
    return Greeting;
  } 
  
  if (context.event.isText) {
    return HandleText;
  }
};

function makeResult(data) {
  const MAX_LENGTH = 2000;

  const noDefMsg = "---\n<Enter number \"2\" to check Dic's def>";
  const noSynonymMsg = "---\n<Enter number \"3\" to check synonym>";
  const noOriginMsg = "---\n<Enter number \"4\" to check origin>";

  let result = `Looking for: \`${data.word}\`\n---\n`
  // print the Cambridge dictionary's definition
  result += data.cambridge + '\n';

  // print the dictionary.com's definition
  if (result.length + data.dictionary.length < MAX_LENGTH - noSynonymMsg.length - noOriginMsg.length) {
    result += data.dictionary;
  } else if (result.length + noDefMsg.length < MAX_LENGTH) {
    result += noDefMsg + '\n';
  }

  // print the synonyms
  if (result.length + data.synonym.length < MAX_LENGTH - noOriginMsg.length) {
    if (data.synonym.length > 0) {
      result += data.synonym + '\n';
    }
  } else if (result.length + noSynonymMsg.length < MAX_LENGTH) {
    result += noSynonymMsg + '\n';
  }

  // print the origin
  if (result.length + data.origin.length < MAX_LENGTH) {
    result += data.origin;
  } else if (result.length + noOriginMsg.length < MAX_LENGTH) {
    result += noOriginMsg;
  }

  return result;
}

module.exports = Main;