class PinYin_LianXi{
	ver = "0.1.40";
	
	Settings = null;
	Gui = null;
	Hanzi = null;
	Plans = null;
	Statistic = null;
	
	#assets = null
	
	init (){
		// assets
		this.assets = {
			hanziData  : hanziData,
			pinyinData : pinyinData,
			planData   : planData
		}
		
		this.Settings = new Settings();
		this.Settings.load();
		
		this.Gui = new GUI({settings: this.Settings, assets: this.assets});
		this.Gui.init();
		
		// 初始化hanzi
		this.Hanzi = new Hanzi({settings: this.Settings, assets: this.assets});
		
		// 初始化plan
		this.Plans = new Plans(planData);
		
		this.Statistic = new Statistic();
		
		// 订阅输入完成事件
		this.Gui.uiElems["inputTextarea"].addEventListener("inputTextareaSubmit", this.submitHandler);
		// 订阅拼音包括设置变动事件
		this.Gui.uiElems["settings"].addEventListener("settingsChange", this.settingsChangeHandler);
		// 订阅统计窗口事件
		this.Gui.uiElems["statsBox"].addEventListener("statsBoxAction", this.statsBoxActionHandler);
		// 订阅统计窗口范围事件
		this.Gui.uiElems["statsRangeBox"].addEventListener("statsRangeBoxAction", this.statsRangeBoxActionHandler);
		// 先整一次
		this.settingsChangeHandler(new Event("firstRun"));
		
	}
	
	// inputTextareaSubmit handler
	submitHandler = e=>{
		// 输入正确，载入下一个汉字
		let curHanzi = this.Hanzi.Queue.at(-1);
		let isCorrect = false;
		if(curHanzi){
			if(e.value == "act_pass" || curHanzi.pinyin.some(
				pinyin => this.Plans.s2q(e.value).includes(pinyin)
			)){
				this.Hanzi.Queue.pop();
				this.requestHanziBoxUpdate();
				isCorrect = e.value == "act_pass" ? false : true;
			}
			
			// 记录
			this.updateStats(curHanzi, e.value, isCorrect);
			// 特效
			this.超クールInputbox(isCorrect ? "correct" : "incorrect");
			// 自动隐藏设置
			if(this.Settings.UIState.AutoHideSettings && !this.Gui.IsSettingsHidden){
				this.Gui.toggleSettings();
			}
			// 提示
			let isShowHint = false;
			if(this.Settings.UIState.HintsThreshold >= 0){
				isShowHint = this.Settings.Stats.streakCurrent.incorrect 
									>= this.Settings.UIState.HintsThreshold;
			}
			this.Gui.showHint(isShowHint);
			
			// queue快薅完了，再整点
			if(this.Hanzi.Queue.length <= 3){
				this.Hanzi.addQueue();
			}
		}
	}
	
	// settingsChange handler
	settingsChangeHandler = e=>{
		// console.log(e); //debug
		
		// 设置初始化/变动重新生成queue
		if(["pinyinInclude", "checkBtn","noise"].includes(e.group) || e.type == "firstRun"){
			this.Hanzi.getQueue();
			this.requestHanziBoxUpdate();
			// 重置序列时重置streak
			this.Settings.clearStreak("correct");
			this.Settings.clearStreak("incorrect");
		}
		// 双拼方案初始化/修改
		if (["spPlan"].includes(e.group) || e.type == "firstRun"){
			this.Plans.setActivePlan(this.Gui.Settings.UIState.Plans.active);
		}
		// 统计
		if (["statsBtn"].includes(e.group)){
			switch (e.detail?.action){
				case "statsShow":
					// 填充默认统计数据(全部)
					this.requestStatsViewBoxUpdate("all");
					break;
				case "statsClear":
					// 提示应放在gui.js中但是摸了
					let token = prompt("输入大写的 CLEARSTATS 来确认删除所有统计数据\n注意: 删除的数据无法恢复");
					if(token == "CLEARSTATS"){
						this.clearStats();
						alert("统计数据已删除");
					} else {
						alert("未删除数据，请输入正确的指令");
					}
					break;
			}
		}
	}
	
	// statsBoxAction handler
	statsBoxActionHandler = e=>{
		// console.log(e); //debug
		
		// 按照过滤范围重新生成统计报告
		if(["filterBtn"].includes(e.group)){
			// 填充统计数据
			this.requestStatsViewBoxUpdate(e.detail.action);
		} else if(["range"].includes(e.group)){
			// 提供填充统计范围所需数据
			this.requestStatsRangeBoxUpdate(e.detail.action);
		}
	}
	
	// statsRangeBoxAction handler
	statsRangeBoxActionHandler = e=>{
		// console.log(e); //debug
		
		if (["submit"].includes(e.group)){
			// 搞到范围info后，更新显示
			let rangeInfo = this.Gui.getStatsRange();
			this.Statistic.RangeInfo = rangeInfo;
			this.requestStatsViewBoxUpdate(this.Gui.getStatsViewBoxType());
		}
	}
	
	// 要求gui汉字box更新
	requestHanziBoxUpdate = ()=>{
		// 汉字box更新时重置incorrect streak
		this.Settings.clearStreak("incorrect");
		// 发送后3个字到gui
		this.Gui.updateHanziBox(
			this.Hanzi.Queue.slice(-3)
		);
	}
	
	// 要求gui统计窗口更新
	requestStatsViewBoxUpdate = (type)=>{
		// 填充统计数据
		this.Statistic.getStats(this.Settings.Stats.records);
		this.Gui.updateStatsViewBox(this.Statistic.getStatsText(type));
	}
	
	// 要求gui统计范围窗口更新
	requestStatsRangeBoxUpdate = ()=>{
		// 提供原始统计数据
		this.Gui.updateStatsRangeBox(this.Settings.Stats.records);
	}
	
	// 记录
	updateStats = (hanzi, input, isCorrect)=>{
		this.Settings.Stats.records.push({
			Input: input,
			InputExpect: this.Plans.q2s(hanzi.pinyin[0]),
			isCorrect: isCorrect,
			Hanzi: hanzi,
			PinyinInfo: this.Plans.getPinyinInfo(hanzi.pinyin[0]),
			SessionId: this.Settings.SessionId,
			Timestamp: Date.now(),
		});
		if(isCorrect){
			// 更新记录
			this.Settings.Stats.streakCurrent.correct += 1;
			this.Settings.Stats.streakCurrent.incorrect = 0;
		} else {
			this.Settings.Stats.streakCurrent.correct = 0;
			this.Settings.Stats.streakCurrent.incorrect += 1;
		}
	}
	
	// 清除记录
	clearStats = ()=>{
		this.Settings.clearStats();
	}
	
	// 特效
	超クールInputbox = (style)=>{
		let 超クールHoldTime = 100;
		
		this.Gui.uiElems["inputBox"].classList.add(style);
		setTimeout(
			() => {
				this.Gui.uiElems["inputBox"].classList.remove(style);
			},
			超クールHoldTime
		);
	}
}