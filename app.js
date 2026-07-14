"use strict";
(function(){
var suits=["S","H","D","C"], symbols={S:"♠",H:"♥",D:"♦",C:"♣"}, ranks=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
var deck,human,cpu,tableCard,wildSuit,house,turn,gameNumber=0,humanCalled,cpuCalled,humanPenalty,gameOver,awaitingSuit=false,firstTurn=false;
function el(id){return document.getElementById(id)}
function shuffle(a){for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1)),t=a[i];a[i]=a[j];a[j]=t}return a}
function makeDeck(){var a=[];suits.forEach(function(s){ranks.forEach(function(r){a.push({s:s,r:r})})});a.push({s:null,r:"JOKER"},{s:null,r:"JOKER"});return shuffle(a)}
function val(c){if(c.r==="A")return 1;if(/^(2|3|4|5|6|7|8|9|10)$/.test(c.r))return parseInt(c.r,10);return null}
function court(c){return c.r==="J"||c.r==="Q"||c.r==="K"}
function legal(c,who){
 if(firstTurn&&(c.r==="A"||c.r==="10"||c.r==="JOKER"))return false;
 if(c.r==="A"||c.r==="10"||c.r==="JOKER")return true;
 var active=wildSuit||tableCard.s;
 if(court(c))return house===who&&(c.s===active||(court(tableCard)&&c.r===tableCard.r));
 if(c.s===active||c.r===tableCard.r)return true;
 var a=val(c),b=val(tableCard);return a!==null&&b!==null&&a+b===10;
}
function text(c){return c.r==="JOKER"?"🃏":c.r+symbols[c.s]}
function html(c,ok,i){var cls="card"+((c.s==="H"||c.s==="D")?" red":"")+(ok?" legal":"");var style=c.r==="JOKER"?' style="font-size:52px;line-height:1"':"";return '<div class="'+cls+'"'+(ok?' data-i="'+i+'"':"")+style+'>'+text(c)+"</div>"}
var turnReminderTimer=null,flashQueue=[],flashBusy=false;
function stopTurnReminder(){if(turnReminderTimer){clearTimeout(turnReminderTimer);turnReminderTimer=null}el("status").classList.remove("your-turn-pulse")}
function message(x){stopTurnReminder();el("status").textContent=x;if(x==="Your turn"&&turn==="human"&&!gameOver){turnReminderTimer=setTimeout(function(){if(turn==="human"&&!gameOver&&!awaitingSuit)el("status").classList.add("your-turn-pulse")},3000)}}
function runFlashQueue(){if(flashBusy||!flashQueue.length)return;flashBusy=true;var item=flashQueue.shift(),f=el("flash");f.textContent=item.x;f.style.display="flex";setTimeout(function(){f.style.display="none";flashBusy=false;if(item.cb)item.cb();setTimeout(runFlashQueue,30)},item.ms)}
function flash(x,ms,cb){flashQueue.push({x:x,ms:ms||2000,cb:cb});runFlashQueue()}
function render(){
 el("cpuCount").textContent="("+cpu.length+")";el("humanCount").textContent="("+human.length+")";el("deckCount").textContent="("+deck.length+")";
 el("cpu").innerHTML=cpu.map(function(){return '<div class="card back">💀</div>'}).join("");
 el("table").innerHTML=html(tableCard,false,0);el("draw").innerHTML='<div id="pile" class="card back">💀</div>';
 el("human").innerHTML=human.map(function(c,i){return html(c,turn==="human"&&!gameOver&&!humanPenalty&&!awaitingSuit&&legal(c,"human"),i)}).join("");
 Array.prototype.forEach.call(el("human").querySelectorAll("[data-i]"),function(x){x.onclick=function(){playHuman(parseInt(x.getAttribute("data-i"),10))}});
 el("pile").onclick=drawHuman;
 el("house").textContent=house?(house==="human"?"YOU HAVE THE HOUSE 🏠":"COMPUTER HAS THE HOUSE 🏠"):"NO ONE HAS THE HOUSE";
 el("skelter").disabled=!(turn==="computer"&&human.length===1&&!humanCalled&&!gameOver);
}
function start(){
 stopTurnReminder();flashQueue=[];flashBusy=false;el("flash").style.display="none";
 deck=makeDeck();human=[];cpu=[];tableCard=null;wildSuit=null;house=null;humanCalled=false;cpuCalled=false;humanPenalty=false;gameOver=false;awaitingSuit=false;firstTurn=true;gameNumber++;
 for(var i=0;i<7;i++){human.push(deck.pop());cpu.push(deck.pop())}
 var opening=deck.findIndex(function(c){return ["2","3","4","5","6","7","8","9"].indexOf(c.r)>=0});
 tableCard=deck.splice(opening,1)[0];turn=gameNumber%2?"human":"computer";el("chooser").className="hide";
 message(turn==="human"?"Your turn":"Computer starts");render();if(turn==="computer")setTimeout(computerTurn,2000);
}
function finish(who,c,keepWild){
 firstTurn=false;
 if(!keepWild)wildSuit=null;
 var hand=who==="human"?human:cpu;
 if(c.r==="A"||c.r==="10"||c.r==="JOKER"){var keepsHouse=house===who;house=who;flash(keepsHouse?(who==="human"?"YOU KEEP THE HOUSE":"COMPUTER KEEPS THE HOUSE"):(who==="human"?"YOU HAVE THE HOUSE":"COMPUTER HAS THE HOUSE"),hand.length===1?1000:2000)}
 if(hand.length===0){gameOver=true;render();message(who==="human"?"🧙‍♂️ YOU WIN!":"💀 COMPUTER WINS!");flash(who==="human"?"🧙‍♂️ YOU WIN!":"💀 COMPUTER WINS!");return}
 if(hand.length===1&&who==="computer"){cpuCalled=true;flash("💀 SKELTER!")}
 turn=who==="human"?"computer":"human";render();
 if(turn==="computer"){message("Computer turn");setTimeout(computerTurn,2000)}else message("Your turn");
}
function playHuman(i){
 if(turn!=="human"||gameOver||awaitingSuit)return;var c=human[i];if(!c||!legal(c,"human"))return;
 if(human.length===1&&!humanCalled){humanPenalty=true;message("You missed SKELTER. Draw one card.");render();return}
 human.splice(i,1);tableCard=c;
 if(c.r==="JOKER"){awaitingSuit=true;el("chooser").className="";message("Choose a suit");render();return}
 finish("human",c,false);
}
function drawHuman(){
 if(turn!=="human"||gameOver||awaitingSuit)return;
 if(deck.length)human.push(deck.pop());humanPenalty=false;humanCalled=false;firstTurn=false;turn="computer";message("You draw one card. Turn complete.");render();setTimeout(computerTurn,2000);
}
function computerTurn(){
 if(turn!=="computer"||gameOver)return;
 var choices=[];cpu.forEach(function(c,i){if(legal(c,"computer"))choices.push(i)});
 if(!choices.length){if(deck.length)cpu.push(deck.pop());cpuCalled=false;firstTurn=false;turn="human";message("Computer draws one card");render();return}
 if(cpu.length===1&&!cpuCalled){if(deck.length)cpu.push(deck.pop());turn="human";message("Computer missed SKELTER and draws");render();return}
 var i=choices[0];for(var k=0;k<choices.length;k++){if(cpu[choices[k]].r!=="JOKER"){i=choices[k];break}}
 var c=cpu.splice(i,1)[0];tableCard=c;message("Computer played "+text(c));
 if(c.r==="JOKER"){var counts={S:0,H:0,D:0,C:0};cpu.forEach(function(x){if(x.s)counts[x.s]++});wildSuit="S";suits.forEach(function(s){if(counts[s]>counts[wildSuit])wildSuit=s});flash("COMPUTER CHANGE SUIT TO "+symbols[wildSuit]);finish("computer",c,true)}
 else finish("computer",c,false);
}
el("newGame").onclick=start;
el("skelter").onclick=function(){if(human.length===1&&turn==="computer"){humanCalled=true;flash("🧙‍♂️ SKELTER!");message("🧙‍♂️ SKELTER called!");render()}};
Array.prototype.forEach.call(document.querySelectorAll("[data-suit]"),function(b){b.onclick=function(){wildSuit=b.getAttribute("data-suit");awaitingSuit=false;el("chooser").className="hide";flash("YOU CHOOSE "+symbols[wildSuit]);finish("human",tableCard,true)}});

// SKELTER soundtrack — 4-second fade-in
var soundtrack=new Audio("./Espionage.mp3");soundtrack.loop=true;soundtrack.volume=0;soundtrack.preload="auto";
var fadeTimer=null,musicButton=el("musicToggle");
function fadeMusicIn(){if(fadeTimer)clearInterval(fadeTimer);soundtrack.volume=0;soundtrack.play().then(function(){musicButton.textContent="MUSIC: ON";var step=0,steps=40,target=.55;fadeTimer=setInterval(function(){step++;soundtrack.volume=Math.min(target,target*step/steps);if(step>=steps){clearInterval(fadeTimer);fadeTimer=null}},100)}).catch(function(){musicButton.textContent="MUSIC: OFF"})}
function pauseMusic(){if(fadeTimer){clearInterval(fadeTimer);fadeTimer=null}soundtrack.pause();soundtrack.volume=0;musicButton.textContent="MUSIC: OFF"}
musicButton.onclick=function(e){e.preventDefault();e.stopPropagation();if(soundtrack.paused)fadeMusicIn();else pauseMusic()};
el("newGame").addEventListener("click",fadeMusicIn);

// 20-second animated rules intro
var rulesIntro=el("rulesIntro"),closeIntro=el("closeIntro"),replayIntro=el("replayIntro"),introTimer=null;
function hideRulesIntro(){if(introTimer){clearTimeout(introTimer);introTimer=null}if(rulesIntro)rulesIntro.style.display="none"}
function playRulesIntro(){if(!rulesIntro)return;if(introTimer)clearTimeout(introTimer);rulesIntro.style.display="flex";var box=rulesIntro.querySelector(".intro-box");box.classList.remove("intro-running");void box.offsetWidth;box.classList.add("intro-running");introTimer=setTimeout(hideRulesIntro,25000)}
if(closeIntro)closeIntro.addEventListener("click",hideRulesIntro);
if(replayIntro)replayIntro.addEventListener("click",playRulesIntro);
introTimer=setTimeout(hideRulesIntro,25000);


// Full rules overlay
var fullRules=el("fullRules"),showRules=el("showRules"),closeRules=el("closeRules");
function openFullRules(){if(fullRules)fullRules.style.display="flex"}
function closeFullRules(){if(fullRules)fullRules.style.display="none"}
if(showRules)showRules.addEventListener("click",openFullRules);
if(closeRules)closeRules.addEventListener("click",closeFullRules);
if(fullRules)fullRules.addEventListener("click",function(e){if(e.target===fullRules)closeFullRules()});

start();
})();