let movecnt = 2;
let gametime = 0;
let y_limit = 80;
let resolvePlayerInfo = require("@akashic-extension/resolve-player-info");
let tween_animation = require("@akashic-extension/akashic-timeline");
let PlayerDatas = [{}];
let PlayerIds = [];
let sotugyolabels = [];
let taigakulabels = [];
let font = new g.DynamicFont({
  game: g.game,
  fontFamily: "sans-serif",
  size: 45
});

function main(param) {
  let assetIds = ["haikei","Main_botti","NPC_botti","Main_OK","NPC_OK"];
  let scene = new g.Scene({ game: g.game ,assetIds: assetIds});
  let timeline = new tween_animation.Timeline(scene);

  let startThen = false;
  let gameNowThen = false;
  let gameendThen = false;
  let sotugyoThen = false;
  let gamesecond = 15;



  let gametime = 0;
  let settingObj,settingstrs,sankaObj,startObj,playercntObj
  let backlayer = new g.E({ scene: scene, parent: scene });   //背景
  let buttonlayer = new g.E({ scene: scene, parent: scene });   //ボタン

  scene.onLoad.add(() => {

    /////////////////
    ////放送主判定////
    /////////////////
    g.game.onJoin.add(ev => {
      let broadcasterPlayerId = ev.player.id; // 放送者のプレイヤーID
      // 自分が放送者なら、「締め切る」ボタンを表示。
      if (g.game.selfId === broadcasterPlayerId) {
        settingObj.forEach(Obj => {Obj.touchable = true;});
        //参加処理
        resolvePlayerInfo.resolvePlayerInfo({ raises: true });
        sankaObj.forEach(Obj => {Obj.touchable = false; Obj.hide();});
        sankaObj.forEach(Obj => {Obj.modified();});
      }
      else{
        startObj.forEach(Obj => {Obj.hide(); Obj.touchable = false;});
        settingObj.forEach(Obj => {Obj.touchable = false;});
      }
      settingObj.forEach(Obj => {Obj.modified();});
      startObj.forEach(Obj => {Obj.modified();});
      settingstrs.forEach(Obj => {Obj.invalidate();});
    });


    /////////////////
    ////参加ボタン////
    /////////////////
    let sankaBack = new g.FilledRect({scene: scene,x: g.game.width*0.9 -10, y: g.game.height * 0.9,
      width: 120, height: 60, cssColor: "black", opacity: 0.3, touchable: true, local: true});
    scene.append(sankaBack);
    let sankaButton = new g.Label({
      scene: scene, x: g.game.width*0.9, y: g.game.height * 0.9, font: font, text: "参加",
      fontSize: 50, textColor: "black",opacity: 1, parent:buttonlayer, local: true
    });
    scene.append(sankaButton);
    sankaBack.onPointDown.add(() => {
      resolvePlayerInfo.resolvePlayerInfo({ raises: true });
      sankaObj.forEach(Obj => {Obj.touchable = false; Obj.hide();});
    });
    sankaObj = [sankaBack,sankaButton];


    ///////////////////////////////////////
    ////操作キャラ生成・プレイヤー情報記録////
    ///////////////////////////////////////
    g.game.onPlayerInfo.add((ev) => {
      // 各プレイヤーが名前利用許諾のダイアログに応答した時、通知されます。
      // ev.player.name にそのプレイヤーの名前が含まれます。
      // (ev.player.id には (最初から) プレイヤーIDが含まれています)

      const isLocalPlayer = ev.player.id === g.game.selfId;

      // プレイヤー画像
      const imageOk = scene.assets[isLocalPlayer ? "Main_OK" : "NPC_OK"];
      const imageNg = scene.assets[isLocalPlayer ? "Main_botti" : "NPC_botti"];

      PlayerIds.push(ev.player.id);
      let playerImage = new g.FrameSprite({scene: scene, src: imageNg,
        x: getrandom(20,1260,-1), y: getrandom(y_limit,700,-1), opacity: 1, local: false, hidden:true});
      scene.append(playerImage);
      playerImage.invalidate();

      PlayerDatas[ev.player.id] = {Name:ev.player.name, Main_Player:playerImage, moveX:0, moveY:0, imageD:0, sotuThen:false, destoroyed:false, imageOk:imageOk, imageNg:imageNg};

      playercntLabel.text = String(PlayerIds.length) + "人",
      playercntLabel.invalidate();
      settingstrs.forEach(Obj => {Obj.invalidate();});
    });


    ////////////////////////////
    ////プレイヤー人数カウント////
    ////////////////////////////
    let playercntLabel = new g.Label({
      scene: scene, x: g.game.width*0.8, y: g.game.height/2.65, font: font, text: 1 + "人",
      fontSize: 75, textColor: "black", touchable: false,opacity: 1,local: false
    });
    scene.append(playercntLabel);

    let playercntHedder = new g.Label({
      scene: scene, x: g.game.width*0.77, y: g.game.height/4, font: font, text: "参加人数",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1
    });
    scene.append(playercntHedder);

    let playercntBack = new g.FilledRect({scene: scene,x: g.game.width*0.73, y: g.game.height/5,
      width: 300, height: 300, cssColor: "black", opacity: 0.5, parent:backlayer,touchable:false});
    scene.append(playercntBack);

    playercntObj = [playercntBack,playercntHedder,playercntLabel]


    /////////////////
    ////開始ボタン////
    /////////////////
    let startBack = new g.FilledRect({scene: scene,x: g.game.width*0.1 -10, y: g.game.height * 0.9,
      width: 215, height: 60, cssColor: "black", opacity: 0.3, touchable: false, local: true});
    scene.append(startBack);
    let startButton = new g.Label({
      scene: scene, x: g.game.width*0.1, y: g.game.height * 0.9, font: font, text: "締め切る",
      fontSize: 50, textColor: "black", parent:buttonlayer, local: true
    });
    scene.append(startButton);
    startBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "GameStart" }));
    });
    startObj = [startBack,startButton];


    ///////////////////
    ////制限時間設定////
    ///////////////////
    let gamesecondBack = new g.FilledRect({scene: scene,x: g.game.width*0.05, y: g.game.height/5,
      width: 760, height: 300, cssColor: "black", opacity: 0.5, parent:backlayer,touchable:false, local:false});
    scene.append(gamesecondBack);

    //秒ラベル
    let gamesecondLabel = new g.Label({
      scene: scene, x: g.game.width*0.28, y: g.game.height/2.65, font: font, text: gamesecond + "秒",
      fontSize: 75, textColor: "black", touchable: false,opacity: 1,local: false
    });
    scene.append(gamesecondLabel);

    let gamesecondHedder = new g.Label({
      scene: scene, x: g.game.width*0.26, y: g.game.height/4, font: font, text: "制限時間",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1,local: false
    });
    scene.append(gamesecondHedder);

    // 残り時間表示用ラベル
    let timeLabel = new g.Label({
      scene: scene, x: g.game.width * 0.05, font: font, text: "60", hidden:true,
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(timeLabel);

    //秒ボタン(プラス)
    let oneplusBack = new g.FilledRect({scene: scene,x: g.game.width*0.55, y: g.game.height/2.5,
      width: 100, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,local: false});
    scene.append(oneplusBack);
    oneplusBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: 1}));
    });
    let oneplusButton = new g.Label({
      scene: scene, x: g.game.width*0.56, y: g.game.height/2.5, font: font, text: "+１",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(oneplusButton);

    let tenplusBack = new g.FilledRect({scene: scene,x: g.game.width*0.44, y: g.game.height/2.5,
      width: 120, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,local: false});
    scene.append(tenplusBack);
    tenplusBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: 10}));
    });
    
    let tenplusButton = new g.Label({
      scene: scene, x: g.game.width*0.445, y: g.game.height/2.5, font: font, text: "+10",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(tenplusButton);


    //秒ボタン(マイナス)
    let onepullBack = new g.FilledRect({scene: scene,x: g.game.width*0.07, y: g.game.height/2.5,
      width: 95, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,local: false});
    scene.append(onepullBack);
    onepullBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: -1}));
    });
    let onepullButton = new g.Label({
      scene: scene, x: g.game.width*0.085, y: g.game.height/2.5, font: font, text: "-１",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(onepullButton);

    let tenpullBack = new g.FilledRect({scene: scene,x: g.game.width*0.16, y: g.game.height/2.5,
      width: 110, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,touchable:true,local: false});
    scene.append(tenpullBack);
    tenpullBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: -10}));
    });
    let tenpullButton = new g.Label({
      scene: scene, x: g.game.width*0.17, y: g.game.height/2.5, font: font, text: "-10",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(tenpullButton);

    settingObj = [startBack,oneplusBack,onepullBack,tenplusBack,tenpullBack,gamesecondBack,gamesecondHedder];
    settingstrs = [startButton,oneplusButton,onepullButton,tenplusButton,tenpullButton,gamesecondLabel]

    ////////////////////////////
    ////背景画像・クリック処理////
    ////////////////////////////
    let background = new g.FrameSprite({scene: scene, src: scene.assets["haikei"], parent: backlayer,opacity: 0.5, touchable: false});

    scene.onPointDownCapture.add((ev) =>{
      if (gameNowThen == true){
        if (PlayerIds.indexOf(ev.player.id) != -1){  
          let NextX = ev.point.x - 22.5;
          let NextY = ev.point.y - 29.5;
          let imageD = Math.abs(Math.sqrt(Math.pow(Math.abs(PlayerDatas[ev.player.id].Main_Player.x - NextX),2) + Math.pow(Math.abs(PlayerDatas[ev.player.id].Main_Player.y - NextY),2)));
          timeline.create(PlayerDatas[ev.player.id].Main_Player).moveTo(NextX, NextY, imageD * 5);
        }
      }
    });

    let backLabel = new g.FilledRect({scene: scene,hidden:true,
      width: g.game.width, height: g.game.height, cssColor: "black", opacity: 1});
    scene.append(backLabel);

    let strLabel = new g.Label({scene: scene,x: g.game.width/2.4,y: 20,font: font,
      text: "卒業",fontSize: 50, textColor: "white",opacity: 1,touchable: true ,hidden:true});
    scene.append(strLabel);
    
    settingObj.forEach(Obj => {Obj.modified();});
    settingstrs.forEach(Obj => {Obj.modified();});
    startObj.forEach(Obj => {Obj.modified();});
    sankaObj.forEach(Obj => {Obj.modified();});
    playercntObj.forEach(Obj => {Obj.modified();});
    background.invalidate();
    backLabel.modified();


    /////////////////////
    ////グローバル処理////
    /////////////////////
    scene.message.add((ev) =>{
      switch (ev.data.message){
        case "GameStart":
          timeLabel.text = String(gamesecond);
          timeLabel.show();
          timeLabel.invalidate();
          startThen = true;
          break;

        case "secondUpdate":
          gamesecond += ev.data.PulsSecond;
          if (gamesecond < 1){
            gamesecond = 1;
          }
          else if (gamesecond > 60){
            gamesecond = 60;
          }
          gamesecondLabel.text = gamesecond + "秒";
          gamesecondLabel.invalidate();
          break;

        case "Player_Move":
          PlayerIds.forEach(Id => {
            //卒業判定
            let result = false;
            let zyuhukuIds = []
            PlayerIds.forEach(Id2 => {
              if (Id != Id2){
                let x1 = PlayerDatas[Id].Main_Player.x;
                let x2 = PlayerDatas[Id2].Main_Player.x;
                let y1 = PlayerDatas[Id].Main_Player.y;
                let y2 = PlayerDatas[Id2].Main_Player.y;
                if (Math.abs(x1 - x2) < 22.5 && Math.abs(y1 - y2) < 22.5){
                  zyuhukuIds.push(Id2);
                }
              }
            });
            if (zyuhukuIds == []){
              result = false;
            }
            else if (zyuhukuIds.length == 1){
              result = true;
              PlayerIds.forEach(Id2 => {
                if (zyuhukuIds[0] != Id && zyuhukuIds[0] != Id2 && Id != Id2){
                  let x1 = PlayerDatas[zyuhukuIds[0]].Main_Player.x;
                  let x2 = PlayerDatas[Id2].Main_Player.x;
                  let y1 = PlayerDatas[zyuhukuIds[0]].Main_Player.y;
                  let y2 = PlayerDatas[Id2].Main_Player.y;
                  if (Math.abs(x1 - x2) < 22.5 && Math.abs(y1 - y2) < 22.5){
                    result = false;
                  }
                }
              });
            }
            else{
              result = false;
            }
            //プレイヤー画像更新
            PlayerDatas[Id].sotuThen = result;
            PlayerDatas[Id].Main_Player.src = result ? PlayerDatas[Id].imageOk : PlayerDatas[Id].imageNg;
            PlayerDatas[Id].Main_Player.invalidate();
          });

        default:
          break;
      }
    });


    /////////////////
    ////ゲーム動作////
    /////////////////
    scene.onUpdate.add(() => {
      gametime += 0.5 / g.game.fps; 

      if (startThen == true){
        //開始処理
        settingObj.forEach(Obj => {Obj.touchable = false; Obj.hide(); Obj.modified();});
        settingstrs.forEach(Obj => {Obj.touchable = false; Obj.hide(); Obj.modified();});
        startObj.forEach(Obj => {Obj.touchable = false; Obj.hide(); Obj.modified();});
        sankaObj.forEach(Obj => {Obj.touchable = false; Obj.hide(); Obj.modified();});
        playercntObj.forEach(Obj => {Obj.touchable = false; Obj.hide(); Obj.modified();});
        
        background.opacity = 1;
        background.invalidate();


        PlayerIds.forEach(Id => {
          PlayerDatas[Id].Main_Player.invalidate();
          PlayerDatas[Id].Main_Player.show();
        });
        startThen = false;
        gameNowThen = true;
      }

      if (gameNowThen == true){
        //ゲームメイン処理
        //移動処理
        if ((gamesecond - gametime) > 0){
          g.game.raiseEvent(new g.MessageEvent({ message: "Player_Move"}));
          gametime += 1 / g.game.fps; 
          timeLabel.text = String((Math.floor((gamesecond - gametime) * 10) / 10));
          timeLabel.invalidate();
        }
        else{
          gameNowThen = false;
          gameendThen = true;

          background.hide();
          timeLabel.hide();
          let sotugyoY = 0;
          let taigakuY = 0;
          PlayerIds.forEach(Id => {
            PlayerDatas[Id].Main_Player.hide();

            if (PlayerDatas[Id].sotuThen == true){
              sotugyolabels.push(user_add(scene,PlayerDatas[Id].Name,sotugyoY));
              sotugyoY += 60;
            }
            else{
              taigakulabels.push(user_add(scene,PlayerDatas[Id].Name,taigakuY));
              taigakuY += 60;
            }
          });

          console.log(sotugyolabels);
          console.log(taigakulabels);
          backLabel.show();
          strLabel.show();
          strLabel.invalidate();
        }
      }


      if (gameendThen == true){
        //終了処理
        let sotuNow = true;
        let taiNow = false;
        let endThen = false;
        if (sotugyolabels.length > 0){
          if (sotuNow == true){
            sotugyolabels = userList_show(sotugyolabels);
            if (showEnd_Then(sotugyolabels) == true){
              sotuNow = false;
              taiNow = true;
            }
          }
        }
        else{
          sotuNow = false;
          taiNow = true;
        }

        if (taigakulabels.length > 0){
          if (taiNow == true){
            strLabel.text = "退学";
            strLabel.invalidate();
            taigakulabels = userList_show(taigakulabels);
            if (showEnd_Then(taigakulabels) == true){
              taiNow = false;
              endThen = true;
            }
          }
        }
        else{
          taiNow = false;
          endThen = true;
        }

        if (endThen == true){
          console.log("end");
          gameendThen = false;
          sotugyoThen = true;
        }
      }
    });
  });

  g.game.pushScene(scene);
};


module.exports = main;

function getrandom(min,max,exc){
  let int = g.game.random.get(min, max);
  while(exc != -1 && exc == int){
      int = g.game.random.get(min, max);
  }
  return int
};

function user_add(scene,Nametxt,plusY){
  let userLabel = new g.Label({
    scene: scene, x: g.game.width/ 2.65, y: g.game.height + plusY, font: font, text: Nametxt, fontSize: 50, 
    textColor: "white", opacity: 1,touchable: true, hidden:true});
  scene.append(userLabel);
  userLabel.invalidate();
  return userLabel;
}

function userList_show(labels){
  let labelwait = 15 / labels.length;
  labels.forEach(label =>{
    if (label.y < 70){
      label.hide();
    }
    else if (label.y <= g.game.height){
      label.show();
    }
    label.y -= labelwait;
    label.invalidate();
  });
  return labels
}

function showEnd_Then(labels){
  let result = true;
  labels.forEach(label =>{
    if (label.visible() == true){
      result = false;
    }
  });
  return result;
}