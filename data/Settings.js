class Settings{
	ver = "0.1.9";
	
	UIState = null;
	Stats = null;
	
	#sessionId = -1;
	
	constructor(){
		this.sessionId = Date.now();
		this.UIState = {
			PinyinInclude: {
				shengmu: {},
				yunmu: {},
				yinjie: {},
			},
			Plans: {
				active: null
			},
			Noise: 0,
			AutoHideSettings: false,
			HintsThreshold: 1, // 默认输错就显示拼音
		};
		this.Stats = {
			streakCurrent: {
				correct: 0,
				incorrect: 0,
			},
			// 此处应定义record架构，但是摸了(
			// {
			//    Input: 双拼输入，如ul
			//    InputExpect: 正确的双拼输入
			//    isCorrect: 是否正确
			//    Hanzi: 相关的hanzi对象
			//    PinyinInfo: Plans.getPinyinInfo(hanzi.pinyin[0])
			//    SessionId: Settings.SessionId
			//    Timestamp: Date.now()
			// }
			records: [],
		};
	}
	
	get SessionId (){
		return this.sessionId;
	};
	
	// Save all settings
	save = ()=>{
		this.storageWrite("Settings", JSON.stringify(this));
		
		console.log("Settings Saved");
	}
	
	// Load all settings
	load = ()=>{
		let settingObj = null;
		try{
			settingObj = JSON.parse(this.storageRead("Settings"));
		} catch {
			settingObj = null;
		}
		if(settingObj) {
			this.UIState = settingObj.UIState;
			this.Stats = settingObj.Stats;
		};
		
		console.log("Settings Loaded");
	}
	
	// Clear stats only
	clearStats = ()=>{
		this.Stats = {
			streakCurrent: {
				correct: 0,
				incorrect: 0,
			},
			records: [],
		};
	}
	
	// Clear streak only
	clearStreak = (type)=>{
		if(type && this.Stats.streakCurrent[type]){
			this.Stats.streakCurrent[type] = 0;
		}
	}
	
	// localstorage read
	storageRead = (key)=>{
		let val = null;
		if(key){
			val = localStorage.getItem(key);
		}
		return val;
	}
	// localstorage write
	storageWrite = (key, val)=>{
		localStorage.setItem(key, val);
		return 0;
	}
}