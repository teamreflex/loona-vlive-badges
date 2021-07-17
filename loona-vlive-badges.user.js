// ==UserScript==
// @name           LOONA vlive detect
// @version        1.1
// @description    Detects LOONA members in chat.
// @match          https://www.vlive.tv/*
// @grant          none
// @run-at         document-end
// ==/UserScript==

(function () {
  let userIds = [
    { name: 'Heejin',     color: 'magenta',                                           id: 'c9be75d0-9a25-11e8-9227-a0086f45fe1c' },
    { name: 'Hyunjin',    color: 'yellow; color: black',                              id: 'e645a450-0b7e-11ea-a87e-246e96398d40' },
    { name: 'Haseul',     color: 'green',                                             id: '70b62940-496d-11e9-99d3-a0086f9996be' },
    { name: 'Yeojin',     color: 'orange; color: black',                              id: 'b3f2d5a0-bd8b-11e8-a118-246e9648766c' },
    { name: 'Vivi',       color: 'pink; color: black',                                id: 'e49f2280-1eaa-11eb-8fcf-a0086f45fe06' },
    { name: 'Kim Lip',    color: 'red',                                               id: '476f21f0-d952-11e6-9fae-000000007398' },
    { name: 'Jinsoul',    color: 'blue',                                              id: '42698900-9b6b-11ea-9eaa-246e96487f70' },
    { name: 'Choerry',    color: 'purple',                                            id: '-missing-' },
    { name: 'Yves',       color: 'brown',                                             id: '76d03b80-8bf7-11e6-88df-000000002102' },
    { name: 'Chuu',       color: 'peachpuff; color: black',                           id: '1fc49510-18cd-11e9-9777-246e96487868' },
    { name: 'Go Won',     color: 'palegreen; color: black; border: 1px solid black;', id: 'c7fd2860-3b44-11e5-be21-000000001a8c' },
    { name: 'Olivia Hye', color: 'grey; color: black',                                id: '610b1690-de62-11eb-8ebb-246e9648766c' },
    { name: 'soulbriz',   color: 'gold; color: black',                                id: 'b32ae600-d25e-11e5-8239-000000003984' },
  ];
  
  // watch chatbox for updates
  var observeDOM = (function() {
  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;

  return function( obj, callback ) {
    if (!obj || obj.nodeType !== 1) return; 

    if (MutationObserver) {
      // define a new observer
      var mutationObserver = new MutationObserver(callback)

      // have the observer observe foo for changes in children
      mutationObserver.observe(obj, { childList:true, subtree:true })
      return mutationObserver
    }
    
    // browser support fallback
    else if( window.addEventListener ){
      obj.addEventListener('DOMNodeInserted', callback, false)
      obj.addEventListener('DOMNodeRemoved', callback, false)
    }
  }
  })();
  
  // allow us to insert the edited fanship badge
  function htmlToElement(html) {
    var template = document.createElement('template');
    html = html.trim();
    template.innerHTML = html;
    return template.content.firstChild;
  }
  
  function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
  }
  
  // parse the classList to a valid iterable
  function parseClassList(chat) {
    const classList = chat.classList;
    if (! isIterable(classList)) return null;
    return [...classList];
  }
  
  // parse info from the css class list
  function parseInfo(chat) {
    let parsed = parseClassList(chat);
    if (! parsed) return { member: false, commentId: false };
    
    let member = false;
    let userId = false;
    let foundId = parsed.find(c => c.startsWith('_user_id_no_'));
    if (foundId !== undefined) {
      userId = foundId.replace('_user_id_no_', '');
      member = userIds.find(u => u.id === userId);
    }
    
    let commentId = parsed.find(c => c.startsWith('cbox_module__comment_'));
    commentId = commentId.replace('cbox_module__comment_', '');
        
    return {
      userId,
      member,
      commentId,
    };
  }
  
  // delay by 5 seconds as the chat is loaded in async
  setTimeout(() => {
    const channelName = document.getElementsByClassName('channel_name--1VIVt')[0];
    if (channelName.getAttribute('title') !== '이달의 소녀(LOONA)') {
      console.log('Not on LOONA vlive, disabling.');
      return;
    }

    let chatbox = document.getElementsByClassName('u_cbox_list')[0];
    if (! chatbox) {
      console.log('Chatbox not found.')
      return;
    }
    
    console.log('Chatbox loaded.');
    
    // clear chatbox
    chatbox.innerHTML = '';
    
    let matches = [];
  
    observeDOM(chatbox, m => {
      var addedNodes = [];
      m.forEach(record => record.addedNodes.length & addedNodes.push(...record.addedNodes));

      // filter because our badge-adding also comes through
      // loop because sometimes two chats come through one update
      addedNodes.filter(node => node.localName = 'li').forEach(chat => {
        // skip over any node that isn't a valid chat
        const classList = parseClassList(chat);
        const objectIsBadgeInsert = (classList === null || !!classList.find(c => c.startsWith('u_cbox_ico_level')));
        if (! chat || typeof chat !== 'object' || objectIsBadgeInsert) return;
        
        // does the chat match the ids?
        const { userId, member, commentId } = parseInfo(chat);
        if (! commentId) return;
        
        // remove chat if already logged
        if (matches.includes(commentId)) {
          if (! member) {
            chat.remove();
          }
          
          return;
        }
        matches.push(commentId);
        
        console.log({
          name: chat.querySelector('.u_cbox_nick').textContent,
          message: chat.querySelector('.u_cbox_contents').textContent,
          comment: commentId,
          userId: userId,
        });
        
        // remove any non-member chat
        if (! member) {
          chat.remove();
          return;
        }
        
        // output chat to console
        let nick = chat.querySelector('.u_cbox_nick').textContent;
        let message = chat.querySelector('.u_cbox_contents').textContent;
        console.log({
          message: message,
          name: nick,
          member: member ? member.name : nick,
          commentId: commentId,
        });
        
        // set bubble color
        chat.querySelector('.u_cbox_area').style.backgroundColor = 'rgb(66, 245, 105, 0.7)';
      
        // add badge
        let user = chat.querySelector('.u_cbox_name');
        let badge = htmlToElement(`<span class="u_cbox_ico_level u_cbox_Premium" style="background-image: none; background-color: ${member.color};">${member.name}</span>`);
        user.before(badge);
      });
    });
  }, 5000);
})();
