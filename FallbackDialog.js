"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FallbackDialog = void 0;
var akashic_hover_plugin_1 = require("@akashic-extension/akashic-hover-plugin");
var HoverPluginRaw = require("@akashic-extension/akashic-hover-plugin/lib/HoverPlugin");
// Ugh! HoverPlugin が Akashic Engine 向けに中途半端に CommonJS で (module.exports = HoverPlugin と)
// 定義されている関係で、 import すると TS の型と実体が合わない。無理やり解消する。
// (import * as ... すると、 JS 的には HoverPlugin の実体が手に入るが、TS 上では namespace と誤認される)
// さらにおそらく akashic-hover-plugin 側のバグで、型があっていないのでそれも無理やり合わせる。
// (コンストラクタ第二引数が間違っている。実装上は any キャストして正しく使っている)
var HoverPlugin = HoverPluginRaw;
function drawCircle(rendr, centerX, centerY, radius, cssColor) {
    for (var y = (centerY - radius) | 0; y <= Math.ceil(centerY + radius); ++y) {
        var w = radius * Math.cos(Math.asin((centerY - y) / radius));
        rendr.fillRect(centerX - w, y, 2 * w, 1, cssColor);
    }
}
function makeSurface(w, h, drawer) {
    var s = g.game.resourceFactory.createSurface(Math.ceil(w), Math.ceil(h));
    var r = s.renderer();
    r.begin();
    drawer(r);
    r.end();
    return s;
}
function animate(e, motions) {
    var onEnd = new g.Trigger();
    var frameTime = 1000 / g.game.fps;
    var step = 0;
    var time = 0;
    var mot = motions[0];
    var ended = false;
    function update(delta) {
        time += delta;
        if (time > mot.duration) {
            ended = (++step >= motions.length);
            if (ended) {
                time = mot.duration;
                e.scene.onUpdate.addOnce(onEnd.fire, onEnd);
            }
            else {
                time -= mot.duration;
                mot = motions[step];
            }
        }
        var r = Math.min(1, time / mot.duration);
        var scale = mot.scale, opacity = mot.opacity;
        if (scale)
            e.scaleX = e.scaleY = scale[0] + (scale[1] - scale[0]) * r;
        if (opacity)
            e.opacity = opacity[0] + (opacity[1] - opacity[0]) * r;
        e.modified();
        return ended;
    }
    update(0);
    e.onUpdate.add(function () { return update(frameTime); });
    return onEnd;
}
var FallbackDialog = /** @class */ (function () {
    function FallbackDialog(name) {
        var _this = this;
        this.onEnd = new g.Trigger();
        this.isHoverPluginStarted = false;
        this.timer = null;
        if (!FallbackDialog.isSupported())
            return;
        var game = g.game;
        var gameWidth = game.width, gameHeight = game.height;
        var baseWidth = 1280;
        var ratio = gameWidth / baseWidth;
        var titleFontSize = Math.round(32 * ratio);
        var fontSize = Math.round(28 * ratio);
        var lineMarginRate = 0.3;
        var lineHeightRate = 1 + lineMarginRate;
        var titleTopMargin = 80 * ratio;
        var titleBotMargin = 32 * ratio;
        var buttonTopMargin = 42 * ratio;
        var buttonWidth = 360 * ratio;
        var buttonHeight = 82 * ratio;
        var buttonBotMargin = 72 * ratio;
        var colorBlue = "#4a8de1";
        var colorWhite = "#fff";
        var dialogWidth = 960 * ratio | 0;
        var dialogHeight = (titleTopMargin +
            (titleFontSize * lineHeightRate) * 2 +
            titleBotMargin +
            (fontSize + fontSize * lineHeightRate) + // 一行目のマージンは titleBotMargin に繰り込まれている
            buttonTopMargin +
            buttonHeight +
            buttonBotMargin) | 0;
        var font = new g.DynamicFont({
            game: g.game,
            fontFamily: g.FontFamily.SansSerif,
            size: titleFontSize,
            fontWeight: g.FontWeight.Bold,
            fontColor: "#252525"
        });
        var surfSize = Math.ceil(32 * ratio) & ~1; // 切り上げて偶数に丸める
        var surfHalf = surfSize / 2;
        var dialogBgSurf = makeSurface(surfSize, surfSize, function (r) { return drawCircle(r, surfHalf, surfHalf, surfHalf, colorWhite); });
        var btnActiveBgSurf = makeSurface(surfSize, surfSize, function (r) { return drawCircle(r, surfHalf, surfHalf, surfHalf, colorBlue); });
        var btnBgSurf = makeSurface(surfSize, surfSize, function (r) {
            drawCircle(r, surfHalf, surfHalf, surfHalf, colorBlue);
            drawCircle(r, surfHalf, surfHalf, 12 * ratio, colorWhite);
        });
        function makeLabel(param) {
            return new g.Label(__assign({ scene: scene, font: font, local: true, textAlign: g.TextAlign.Center, widthAutoAdjust: false }, param));
        }
        var scene = this.scene = game.scene();
        var bg = this.bgRect = new g.FilledRect({
            scene: scene,
            local: true,
            width: gameWidth,
            height: gameHeight,
            cssColor: "rgba(0, 0, 0, 0.5)",
            touchable: true // 後ろの touch を奪って modal にする
        });
        var dialogPane = this.dialogPane = new g.Pane({
            scene: scene,
            local: true,
            width: dialogWidth,
            height: dialogHeight,
            anchorX: 0.5,
            anchorY: 0.5,
            x: (game.width / 2) | 0,
            y: (game.height / 2) | 0,
            backgroundImage: dialogBgSurf,
            backgroundEffector: new g.NinePatchSurfaceEffector(game, dialogBgSurf.width / 2 - 1),
            parent: bg
        });
        var dialogTextX = (80 * ratio) | 0;
        var dialogTextWidth = (800 * ratio) | 0;
        var y = 0;
        y += titleTopMargin + (titleFontSize * lineMarginRate) | 0;
        dialogPane.append(makeLabel({
            x: dialogTextX,
            y: y,
            text: "このコンテンツは名前を利用します。",
            fontSize: titleFontSize,
            width: dialogTextWidth
        }));
        y += (titleFontSize * lineHeightRate) | 0;
        dialogPane.append(makeLabel({
            x: dialogTextX,
            y: y,
            text: "\u3042\u306A\u305F\u306F\u300C" + name + "\u300D\u3067\u3059\u3002",
            fontSize: titleFontSize,
            width: dialogTextWidth
        }));
        y += titleFontSize + titleBotMargin | 0;
        dialogPane.append(makeLabel({
            x: dialogTextX,
            y: y,
            text: "ユーザ名で参加するには、",
            fontSize: fontSize,
            width: dialogTextWidth
        }));
        y += fontSize * lineHeightRate | 0;
        dialogPane.append(makeLabel({
            x: dialogTextX,
            y: y,
            text: "最新のニコニコ生放送アプリに更新してください。",
            fontSize: fontSize,
            width: dialogTextWidth
        }));
        y += fontSize + buttonTopMargin | 0;
        var buttonPane = new g.Pane({
            scene: scene,
            local: true,
            width: buttonWidth,
            height: buttonHeight,
            x: dialogWidth / 2,
            y: y + buttonHeight / 2,
            anchorX: 0.5,
            anchorY: 0.5,
            backgroundImage: btnBgSurf,
            backgroundEffector: new g.NinePatchSurfaceEffector(game, btnBgSurf.width / 2 - 1),
            parent: scene,
            touchable: true
        });
        dialogPane.append(buttonPane);
        var buttonLabel = this.buttonLabel = makeLabel({
            x: 0,
            y: (buttonHeight - titleFontSize) / 2 - (5 * ratio),
            text: "OK (15)",
            fontSize: titleFontSize,
            width: buttonWidth,
            textColor: colorBlue
        });
        buttonPane.append(buttonLabel);
        var activateButton = function () {
            buttonPane.backgroundImage = btnActiveBgSurf;
            buttonPane.invalidate();
            buttonLabel.textColor = colorWhite;
            buttonLabel.invalidate();
        };
        var deactivateButton = function () {
            buttonPane.backgroundImage = btnBgSurf;
            buttonPane.invalidate();
            buttonLabel.textColor = colorBlue;
            buttonLabel.invalidate();
        };
        var h = akashic_hover_plugin_1.Converter.asHoverable(buttonPane);
        var animating = false;
        h.hovered.add(function () {
            activateButton();
            if (animating)
                return;
            animating = true;
            animate(buttonPane, [
                { duration: 16, scale: [1.0, 0.9] },
                { duration: 16, scale: [0.9, 1.1] },
                { duration: 33, scale: [1.1, 1.0] }
            ]).add(function () { return animating = false; });
        });
        h.unhovered.add(deactivateButton);
        buttonPane.onPointDown.add(activateButton);
        buttonPane.onPointUp.add(function () { _this.end(); });
        if (!game.operationPluginManager.plugins[FallbackDialog.HOVER_PLUGIN_OPCODE])
            game.operationPluginManager.register(HoverPlugin, FallbackDialog.HOVER_PLUGIN_OPCODE);
    }
    FallbackDialog.isSupported = function () {
        // 縦横比 0.4 について: このダイアログは 16:9 の解像度で画面高さの約 65% (468px) を占有する。
        // すなわち画面高さが画面幅の約 37% 以下の場合画面に収まらない。余裕を見て 40% を下限とする。
        // (詳細な高さは下の dialogHeight の定義を参照せよ)
        return (typeof window !== "undefined") && (g.game.height / g.game.width >= 0.4) && HoverPlugin.isSupported();
    };
    FallbackDialog.prototype.start = function (remainingSeconds) {
        var _this = this;
        var game = g.game;
        var scene = this.scene;
        if (game.scene() !== scene) { // ないはずの異常系だが一応確認
            return;
        }
        // エッジケース考慮: hoverプラグインは必ず停止したいので、シーンが変わった時点で止めてしまう。
        // (mouseover契機で無駄にエンティティ検索したくない)
        game.onSceneChange.add(this._disablePluginOnSceneChange, this);
        game.operationPluginManager.start(FallbackDialog.HOVER_PLUGIN_OPCODE);
        this.isHoverPluginStarted = true;
        animate(this.dialogPane, [
            { duration: 100, scale: [0.5, 1.1], opacity: [0.5, 1.0] },
            { duration: 100, scale: [1.1, 1.0], opacity: [1.0, 1.0] }
        ]);
        scene.append(this.bgRect);
        scene.onUpdate.add(this._assureFrontmost, this);
        this.timer = scene.setInterval(function () {
            remainingSeconds -= 1;
            _this.buttonLabel.text = "OK (" + remainingSeconds + ")";
            _this.buttonLabel.invalidate();
            if (remainingSeconds <= 0) {
                _this.end();
            }
        }, 1000);
    };
    FallbackDialog.prototype.end = function () {
        var _this = this;
        if (this.timer) {
            this.scene.clearInterval(this.timer);
            this.timer = null;
        }
        // 厳密には下のアニメーション終了後に解除する方がよいが、
        // 途中でシーンが破棄されるエッジケースを想定してこの時点で止める。
        this.scene.onUpdate.remove(this._assureFrontmost, this);
        if (this.isHoverPluginStarted) {
            g.game.operationPluginManager.stop(FallbackDialog.HOVER_PLUGIN_OPCODE);
            this.isHoverPluginStarted = false;
        }
        animate(this.dialogPane, [{ duration: 100, opacity: [1, 0], scale: [1, 0.8] }]);
        var t = animate(this.bgRect, [{ duration: 100, opacity: [1, 0] }]);
        t.add(function () {
            var onEnd = _this.onEnd;
            _this.onEnd = null;
            _this.bgRect.destroy();
            _this.bgRect = null;
            _this.dialogPane = null;
            _this.scene = null;
            onEnd.fire();
        });
    };
    FallbackDialog.prototype._disablePluginOnSceneChange = function (scene) {
        if (scene !== this.scene) {
            g.game.operationPluginManager.stop(FallbackDialog.HOVER_PLUGIN_OPCODE);
            return true;
        }
    };
    // フレーム終了時に確実に画面最前面に持ってくる
    FallbackDialog.prototype._assureFrontmost = function () {
        g.game._pushPostTickTask(this._doAssureFrontmost, this);
    };
    FallbackDialog.prototype._doAssureFrontmost = function () {
        var scene = this.scene;
        if (scene && g.game.scene() !== scene)
            return;
        if (scene.children[scene.children.length - 1] === this.bgRect)
            return;
        this.bgRect.remove();
        scene.append(this.bgRect);
    };
    FallbackDialog.HOVER_PLUGIN_OPCODE = -1000; // TODO: 定数予約
    return FallbackDialog;
}());
exports.FallbackDialog = FallbackDialog;
