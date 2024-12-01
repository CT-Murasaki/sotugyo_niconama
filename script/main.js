let y_limit = 80;
let overlap_threshold = 45;
let broadcasterPlayerId = "";
let resolvePlayerInfo = require("@akashic-extension/resolve-player-info");
let tween_animation = require("@akashic-extension/akashic-timeline");
let PlayerDatas = [{}];
let PlayerIds = [];

let font = new g.DynamicFont({
  game: g.game,
  fontFamily: "sans-serif",
  size: 45
});

function main(param) {
  let assetIds = ["title","rule","haikei","bgm1","Main_botti","NPC_botti","Nushi_botti","Main_OK","NPC_OK","Nushi_OK","Main_NG","NPC_NG","Nushi_NG","bgm2","sotugyo","taiho"];
  let scene = new g.Scene({ game: g.game ,assetIds: assetIds});
  let timeline = new tween_animation.Timeline(scene);

  let sotugyolabels = [];
  let taigakulabels = [];

  let startThen = false;
  let gameNowThen = false;
  let waitthen = false;
  let gameendThen = false;
  let sotugyoThen = false;

  let gamesecond = 15;
  let waittime = 0;

  let gametime = 0;
  let titleObj,settingObj,settingstrs,sankaObj,startObj,playercntObj
  let bgm1,bgm2
  let backlayer = new g.E({ scene: scene, parent: scene });   //背景
  let buttonlayer = new g.E({ scene: scene, parent: scene });   //ボタン

  scene.onLoad.add(() => {

    //BGMは参加の有無に関係なく全員に流す
    bgm1 = scene.asset.getAudio("/audio/huon").play();
    bgm1.changeVolume(0.1);

    /////////////////
    ////放送主判定////
    /////////////////
    g.game.onJoin.add(ev => {
      broadcasterPlayerId = ev.player.id; // 放送者のプレイヤーID
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

    
    ///////////////////
    ////タイトル画面////
    ///////////////////
    let background = new g.FrameSprite({scene: scene, src: scene.assets["haikei"], parent: backlayer,opacity: 0.5, touchable: false});

    let title_Image = new g.FrameSprite({scene: scene, x: g.game.width*0.05, y: g.game.height * 0.02,
       src: scene.assets["title"], parent: backlayer,opacity: 1, touchable: false});
    scene.append(title_Image);

    let rule_Image = new g.FrameSprite({scene: scene, x: g.game.width * 0.24, y: g.game.height * 0.65,
      src: scene.assets["rule"], parent: backlayer,opacity: 1, touchable: false});
    scene.append(rule_Image);

   titleObj = [title_Image,rule_Image];


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

    ///////////////////////////////////////////
    ////操作キャラ表示優先度制御用オブジェクト////
    ///////////////////////////////////////////
    const players_back = new g.E({scene: scene, x: 0, y: 0, width: g.game.width, height: g.game.height, touchable: false, local: true});
    scene.append(players_back);

    const players_front = new g.E({scene: scene, x: 0, y: 0, width: g.game.width, height: g.game.height, touchable: false, local: true});
    scene.append(players_front);

    ///////////////////////////////////////
    ////操作キャラ生成・プレイヤー情報記録////
    ///////////////////////////////////////
    g.game.onPlayerInfo.add((ev) => {
      // リログ時にプレイヤーが多重生成されるので対応
      // PlayerIds内に入力されたプレイヤーIDが無い時のみ処理
      if (PlayerIds.indexOf(ev.player.id) == -1){
        // 各プレイヤーが名前利用許諾のダイアログに応答した時、通知されます。
        // ev.player.name にそのプレイヤーの名前が含まれます。
        // (ev.player.id には (最初から) プレイヤーIDが含まれています)

        const isLocalPlayer = ev.player.id === g.game.selfId;
        const Nushi_Then = ev.player.id === broadcasterPlayerId;
        const isHighPriority = isLocalPlayer || Nushi_Then;

        // プレイヤー画像
        const imageOk = scene.assets[isLocalPlayer ? "Main_OK" : Nushi_Then ? "Nushi_OK" : "NPC_OK"];
        const imageNg = scene.assets[isLocalPlayer ? "Main_NG" : Nushi_Then ? "Nushi_NG" : "NPC_NG"];
        const imageBotti = scene.assets[isLocalPlayer ? "Main_botti" : Nushi_Then ? "Nushi_botti" : "NPC_botti"];

        PlayerIds.push(ev.player.id);
        let playerImage = new g.FrameSprite({scene: scene, src: imageBotti,
          x: getrandom(22.5,1240,-1), y: getrandom(y_limit,670,-1), opacity: 1, local: true, hidden:true});
        (isHighPriority ? players_front : players_back).append(playerImage);
        playerImage.invalidate();

        let name = ev.player.name;
        // 名前はnullになることがあるので、その対策としてデフォルト値を設定
        if (name == null) {
          name = "██████████";
        }

        PlayerDatas[ev.player.id] = {
          Name:name,
          Main_Player:playerImage,
          moveX:0,
          moveY:0,
          imageD:0,
          state:"botti",
          sotuThen:false,
          destoroyed:false,
          images:{
            "ok":imageOk,
            "ng":imageNg,
            "botti":imageBotti
          }
        };
        playercntLabel.text = String(PlayerIds.length) + "人",
        playercntLabel.invalidate();
        settingstrs.forEach(Obj => {Obj.invalidate();});
      }
    });


    ////////////////////////////
    ////プレイヤー人数カウント////
    ////////////////////////////
    let playercntBack = new g.FilledRect({scene: scene,x: g.game.width*0.73, y: g.game.height/5,
      width: 300, height: 300, cssColor: "gray", opacity: 0.5, parent:backlayer,touchable:false});
    scene.append(playercntBack);

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

    playercntObj = [playercntBack,playercntHedder,playercntLabel]


    /////////////////
    ////開始ボタン////
    /////////////////
    let startBack = new g.FilledRect({scene: scene,x: g.game.width*0.1 -10, y: g.game.height * 0.9,
      width: 215, height: 60, cssColor: "gray", opacity: 0.3, touchable: false, local: true});
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
    //制限時間設定用背景
    let gamesecondBack = new g.FilledRect({scene: scene,x: g.game.width*0.05, y: g.game.height/5,
      width: 760, height: 300, cssColor: "gray", opacity: 0.5, parent:backlayer,touchable:false, local:false});
    scene.append(gamesecondBack);

    // 残り時間表示用ラベル
    let timeLabel = new g.Label({
      scene: scene, x: g.game.width * 0.05, font: font, text: "60", hidden:true,
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(timeLabel);

    //秒ボタン
    //+1
    let oneplusBack = new g.FilledRect({scene: scene,x: g.game.width * 0.55, y: g.game.height / 2.5,
      width: 100, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,local: false});
    scene.append(oneplusBack);
    oneplusBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: 1}));
    });
    let oneplusButton = new g.Label({
      scene: scene, x: g.game.width * 0.56, y: g.game.height / 2.5, font: font, text: "+１",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(oneplusButton);

    //+10
    let tenplusBack = new g.FilledRect({scene: scene,x: g.game.width * 0.44, y: g.game.height/2.5,
      width: 120, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,local: false});
    scene.append(tenplusBack);
    tenplusBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: 10}));
    });  
    let tenplusButton = new g.Label({
      scene: scene, x: g.game.width * 0.445, y: g.game.height / 2.5, font: font, text: "+10",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(tenplusButton);

    //-1
    let onepullBack = new g.FilledRect({scene: scene,x: g.game.width * 0.07, y: g.game.height / 2.5,
      width: 95, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,local: false});
    scene.append(onepullBack);
    onepullBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: -1}));
    });
    let onepullButton = new g.Label({
      scene: scene, x: g.game.width * 0.085, y: g.game.height / 2.5, font: font, text: "-１",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(onepullButton);

    //-10
    let tenpullBack = new g.FilledRect({scene: scene,x: g.game.width * 0.16, y: g.game.height / 2.5,
      width: 110, height: 60, cssColor: "black", opacity: 0.3, parent:buttonlayer,touchable:true,local: false});
    scene.append(tenpullBack);
    tenpullBack.onPointDown.add(() => {
      g.game.raiseEvent(new g.MessageEvent({ message: "secondUpdate", PulsSecond: -10}));
    });
    let tenpullButton = new g.Label({
      scene: scene, x: g.game.width * 0.17, y: g.game.height / 2.5, font: font, text: "-10",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1, parent:buttonlayer,local: false
    });
    scene.append(tenpullButton);

    //秒ラベル
    let gamesecondLabel = new g.Label({
      scene: scene, x: g.game.width * 0.28, y: g.game.height/2.65, font: font, text: gamesecond + "秒",
      fontSize: 75, textColor: "black", touchable: false,opacity: 1,local: false
    });
    scene.append(gamesecondLabel);
    let gamesecondHedder = new g.Label({
      scene: scene, x: g.game.width * 0.26, y: g.game.height/4, font: font, text: "制限時間",
      fontSize: 50, textColor: "black", touchable: false,opacity: 1,local: false
    });
    scene.append(gamesecondHedder);

    //一括処理したいので配列に放り込む
    settingObj = [startBack,oneplusBack,onepullBack,tenplusBack,tenpullBack,gamesecondBack,gamesecondHedder];
    settingstrs = [startButton,oneplusButton,onepullButton,tenplusButton,tenpullButton,gamesecondLabel]


    ///////////////////
    ////クリック処理////
    ///////////////////
    scene.onPointDownCapture.add((ev) =>{
      if (gameNowThen == true){
        //クリックした位置に移動
        if (PlayerIds.indexOf(ev.player.id) != -1){  
          //枠外飛び出し防止処理
          let NextX = ev.point.x - 22.5;
          if (NextX < 1){
            NextX = 1;
          }
          else if (NextX > 1240){
            NextX = 1240;
          }

          let NextY = ev.point.y - 29.5;
          if (NextY < y_limit){
            NextY = y_limit;
          }
          else if (NextY > 670){
            NextY = 670;
          }

          //斜辺を求める(速度を一定にしたいので)
          let imageD = Math.abs(Math.sqrt(Math.pow(Math.abs(PlayerDatas[ev.player.id].Main_Player.x - NextX),2) + Math.pow(Math.abs(PlayerDatas[ev.player.id].Main_Player.y - NextY),2)));

          //移動処理
          if(PlayerDatas[ev.player.id].moveTween){
            PlayerDatas[ev.player.id].moveTween.cancel();
          }
          PlayerDatas[ev.player.id].moveTween = timeline.create(PlayerDatas[ev.player.id].Main_Player).moveTo(NextX, NextY, imageD * 5);
        }
      }
    });


    /////////////////////////
    ////卒業(退学)リスト用////
    /////////////////////////
    let backLabel = new g.FilledRect({scene: scene,hidden:true, local : true,
      width: g.game.width, height: g.game.height, cssColor: "black", opacity: 1});
    scene.append(backLabel);

    let strLabel = new g.Label({scene: scene,x: 0,y: 20,font: font,widthAutoAdjust:false, width:g.game.width,local : true,
      textAlign:"center" ,text: "卒業",fontSize: 50, textColor: "white",opacity: 1,touchable: true ,hidden:true});
    scene.append(strLabel);
    

    ////////////////////////////
    ////オブジェクト初期化処理////
    ////////////////////////////
    titleObj.forEach(Obj => {Obj.modified();});
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
          //制限時間設定を全体に反映
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

        default:
          break;
      }
    });


    /////////////////
    ////ゲーム動作////
    /////////////////
    scene.onUpdate.add(() => {
      if (startThen == true){
        //開始処理
        //タイトル・設定項目削除
        titleObj.forEach(Obj => {Obj.touchable = false; Obj.hide();});
        settingObj.forEach(Obj => {Obj.touchable = false; Obj.hide();});
        settingstrs.forEach(Obj => {Obj.touchable = false; Obj.hide();});
        startObj.forEach(Obj => {Obj.touchable = false; Obj.hide();});
        sankaObj.forEach(Obj => {Obj.touchable = false; Obj.hide();});
        playercntObj.forEach(Obj => {Obj.touchable = false; Obj.hide();});
        title_Image.hide();
        
        //半透明にしていた背景を非透明化
        background.opacity = 1;
        background.invalidate();

        //プレイヤーオブジェクト生成
        PlayerIds.forEach(Id => {
          PlayerDatas[Id].Main_Player.invalidate();
          PlayerDatas[Id].Main_Player.show();
        });
        startThen = false;
        gameNowThen = true;
      }


      if (gameNowThen == true){
        //ゲームメイン処理
        gametime += 1 / g.game.fps; 
        if ((gamesecond - gametime) > 0){
          //卒業判定
          PlayerIds.forEach(Id => {
            //卒業判定
            //最初はぼっち扱いで、重複が見つからなかったらぼっちのまま終了
            let result = "botti";
            let zyuhukuId = "";
            //重複しているキャラを探索
            for (let i = 0; i < PlayerIds.length; i++){
              let Id2 = PlayerIds[i];
              if (Id != Id2){
                if (g.Collision.withinAreas(PlayerDatas[Id].Main_Player, PlayerDatas[Id2].Main_Player, overlap_threshold)){
                  if (zyuhukuId == ""){
                    //相手方のIdを記憶
                    zyuhukuId = Id2;
                  }
                  else{
                    //重複が２人以上なら２人組では無いので退学
                    zyuhukuId = "";
                    result = "ng";
                    break;
                  }
                }
              }
            }

            if (zyuhukuId !== "") {
              //重複が一人なら一旦卒業扱い
              result = "ok";

              //ペア側の重複キャラを探索
              for (let i = 0; i < PlayerIds.length; i++){
                let Id2 = PlayerIds[i];
                if (zyuhukuId != Id && zyuhukuId != Id2 && Id != Id2){
                  if (g.Collision.withinAreas(PlayerDatas[zyuhukuId].Main_Player, PlayerDatas[Id2].Main_Player, overlap_threshold)){
                    //ペア側に別の重複キャラがいるなら２人組では無いので退学
                    result = "ng";
                    break;
                  }
                }
              }
            }

            //プレイヤー画像更新
            if (PlayerDatas[Id].state !== result){
              PlayerDatas[Id].state = result;
              PlayerDatas[Id].sotuThen = result === "ok" ? true : false;
              PlayerDatas[Id].Main_Player.src = PlayerDatas[Id].images[result];
              PlayerDatas[Id].Main_Player.invalidate();
            }
          });

          //時間更新
          timeLabel.text = String((Math.ceil(gamesecond - gametime)));
          timeLabel.invalidate();
        }
        else{
          //タイムアップ(gametimeが０以下になれば)したらこちらに遷移
          gameNowThen = false;
          waitthen = true;

          //タイマー削除
          timeLabel.hide();

          PlayerIds.forEach(Id => {
            //全プレイヤーの移動を強制停止
            if(PlayerDatas[Id].moveTween){
              PlayerDatas[Id].moveTween.cancel();
            }
          });

          let sotugyoY = 0;
          let taigakuY = 0;
          PlayerIds.forEach(Id => {
            //卒業・退学リスト作成
            if (PlayerDatas[Id].sotuThen == true){
              sotugyolabels.push(user_add(scene,PlayerDatas[Id].Name,sotugyoY));
              sotugyoY += 60;
            }
            else{
              taigakulabels.push(user_add(scene,PlayerDatas[Id].Name,taigakuY));
              taigakuY += 60;
            }
          });
        }
      }

      if (waitthen == true){
        waittime += 1 / g.game.fps;
        if (waittime > 5){
          waitthen = false;

          //bgm停止
          bgm1.stop();

          PlayerIds.forEach(Id => {
            //プレイヤーオブジェクト削除
            PlayerDatas[Id].Main_Player.hide();
          });

          //背景削除
          background.hide();
          timeLabel.hide();

          //卒業・退学リスト用背景・ヘッダー生成
          backLabel.show();
          strLabel.show();
          strLabel.invalidate();

          //卒業用のBGMを流す
          bgm2 = scene.asset.getAudio("/audio/hotaru_piano_5").play().changeVolume(0.1);

          gameendThen = true;
        }
      }


      if (gameendThen == true){
        //エラー処理
        if (sotugyolabels == undefined || taigakulabels == undefined){
          console.error("UserLabel undefined");
          return;
        }

        //卒業・退学一覧処理
        let sotuNow = true;
        let taiNow = false;
        let endThen = false;

        //卒業
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

        //退学
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
        else if (sotuNow == false){
          taiNow = false;
          endThen = true;
        }
        
        //最終処理に遷移(オブジェクト削除)
        if (endThen == true){
          gameendThen = false;
          strLabel.hide();
          backLabel.hide();
          sotugyoThen = true;
        }
      }


      if (sotugyoThen == true){
        //最終処理
        let sotugyo_Obj = [];
        if (PlayerDatas[broadcasterPlayerId].sotuThen == true){
          //放送主が卒業時
          let sotugyo_Image = new g.FrameSprite({scene: scene, src: scene.assets["sotugyo"], parent: backlayer,opacity: 1, touchable: false,local : true});
          sotugyo_Obj.push(sotugyo_Image);
        }
        else{
          //放送主が退学時
          let newsX = g.game.width * 0.1;
          //容疑者
          let suspect_Label = new g.FilledRect({scene: scene,width: 800, height: 70,
             cssColor: "red", opacity: 7, x: newsX, y: g.game.height - 210,local : true});
          sotugyo_Obj.push(suspect_Label);
          let suspect_text = new g.Label({
            scene: scene, x: newsX, y: g.game.height - 210, font: font, text: " " + PlayerDatas[broadcasterPlayerId].Name + "容疑者(12)", fontSize: 50, 
            textColor: "white", opacity: 1,touchable: false,local : true});
          sotugyo_Obj.push(suspect_text);
  
          //ニュース本文
          let Main_Label = new g.FilledRect({scene: scene, width: 1000, height: 125,
             cssColor: "black", opacity: 0.5, x: newsX, y: g.game.height - 140,local : true});
          sotugyo_Obj.push(Main_Label);
          let Main_text1 = new g.Label({
            scene: scene, x: newsX, y: g.game.height - 140, font: font, text: "「２人組が作れないから退学させられた」", fontSize: 50, 
            textColor: "white", opacity: 1,touchable: false,local : true});
          sotugyo_Obj.push(Main_text1);
          let Main_text2 = new g.Label({
            scene: scene, x: newsX, y: g.game.height - 80, font: font, text: " などと訳の分からない供述を続けている", fontSize: 50, 
            textColor: "white", opacity: 1,touchable: false,local : true});
          sotugyo_Obj.push(Main_text2);

          //ニュースヘッダー画像
          let heddar_Image = new g.FrameSprite({scene: scene, src: scene.assets["taiho"], parent: 
            backlayer,opacity: 1, touchable: false, x: g.game.width * 0.7, y: g.game.height * 0.01,local : true});
          sotugyo_Obj.push(heddar_Image);
        }

        //オブジェクト生成
        sotugyo_Obj.forEach(Obj => {scene.append(Obj); Obj.modified();});
        sotugyoThen = false;
      }
    });
  });

  g.game.pushScene(scene);
};


module.exports = main;


//乱数生成機
function getrandom(min,max,exc){
  let int = g.game.random.get(min, max);
  while(exc != -1 && exc == int){
      int = g.game.random.get(min, max);
  }
  return int
};


//卒業(退学)リスト作成用
function user_add(scene,Nametxt,plusY){
  let userLabel = new g.Label({textAlign: "center",widthAutoAdjust : false,local : true,
    scene: scene, x: 0, y: g.game.height + plusY, font: font, text: Nametxt, fontSize: 50, 
    textColor: "white", opacity: 1,touchable: false, hidden:true, width:g.game.width});
  userLabel.invalidate();
  scene.append(userLabel);
  return userLabel;
}

function userList_show(labels){
  let labelwait = 2;
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