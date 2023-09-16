class GUI{
	ver = "0.1.84";
	
	uiSelectorlist = null;
	uiElems = null;
	Settings = null;
	
	get IsSettingsHidden (){
		let isHidden = false;
		if(this.uiElems["settings"]){
			isHidden = this.uiElems["settings"].classList.contains("hidden");
		}
		return isHidden
	}
	
	#assets = null;
	
	constructor({settings: settingsShared, assets: assets}){
		this.Settings = settingsShared || null;
		this.assets = assets || {pinyinData: null, planData: null, hanziData: null}
	}
	
	init (){
		// 初始化html元素表
		this.initializeHTMLElements();
		
		// 订阅GUI交互事件
		this.initializeGUIInteractEvent();
		
		// 填充GUI初始状态
		this.initializeGUIState();
	}
	
	// 初始化静态html元素表
	initializeHTMLElements = ()=>{
		this.uiElems = {};
		this.uiSelectorlist = [
			["interact", ".interact"],
			["inputBox", ".interact div.inputBox"],
			["inputTextarea", ".interact div.inputTextarea"],
			
			["pinyinHint", ".interact .pinyinHint"],
			
			["hanzi-1", ".interact .hanziBox .hanzi-1"],
			["hanzi-2", ".interact .hanziBox .hanzi-2"],
			["hanzi-3", ".interact .hanziBox .hanzi-3"],
			
			["statsBox", ".interact .statsBox"],
			["statsBoxBtns", ".interact .statsBox .statsBtns"],
			["statsBoxViewBox", ".interact .statsBox .viewBox"],
			
			["statsRangeBox", ".interact .statsRangeBox"],
			["statsRangeForm", ".interact #rangeForm"],
			
			["statsRangeDateFrom", ".interact .statsRangeBox .rangeDateFrom"],
			["statsRangeDateTo", ".interact .statsRangeBox .rangeDateTo"],
			["statsRangeSession", ".interact .statsRangeBox select.rangeSession"],
			
			["settings", ".settings"],
			["settingsToggle", ".settingsToggle"],
			["settingsToggleBtn", ".settingsToggleBtn"],
			
			
			["spPlan", ".settings .sp-plan-input"],
			
			["autoHide", ".settings #auto-hide-input"],
			
			["hint", ".settings #hint-input"],
			
			["stats", ".settings .stats"],
			
			["noiseSlider", ".settings .noise-input"],
			["noiseValueLabel", ".settings #noiselist .current"],
			
			["shengmuSettings", ".settings .shengmu.settingboxes"],
			["yunmuSettings", ".settings .yunmu.settingboxes"],
			["yinjieSettings", ".settings .yinjie.settingboxes"],
			
			["shengmuCheckAllBtn", ".settings .shengmu.checkAll"],
			["shengmuCheckRevertBtn", ".settings .shengmu.checkRevert"],
			["shengmuCheckNoneBtn", ".settings .shengmu.checkNone"],
			["yunmuCheckAllBtn", ".settings .yunmu.checkAll"],
			["yunmuCheckRevertBtn", ".settings .yunmu.checkRevert"],
			["yunmuCheckNoneBtn", ".settings .yunmu.checkNone"],
			["yinjieCheckAllBtn", ".settings .yinjie.checkAll"],
			["yinjieCheckRevertBtn", ".settings .yinjie.checkRevert"],
			["yinjieCheckNoneBtn", ".settings .yinjie.checkNone"],
		];
		for(let elemInfo of this.uiSelectorlist){
			this.uiElems[elemInfo[0]] = window.document.querySelector(elemInfo[1]);;
		}
	}
	
	// 订阅GUI交互事件
	initializeGUIInteractEvent = ()=>{
		// 设置显示/隐藏事件
		this.uiElems["settingsToggleBtn"].addEventListener("click", this.toggleSettings);
		
		// 设置变更事件
		this.uiElems["settings"].addEventListener("change", this.settingsChangeHandler);
		// 操作按钮事件
		this.uiElems["settings"].addEventListener("click", this.settingsChangeHandler);
		
		// 统计窗口按钮事件
		this.uiElems["statsBox"].addEventListener("click", this.statsBoxActionHandler);
		
		// 统计窗口范围按钮事件
		this.uiElems["statsRangeBox"].addEventListener("click", this.statsRangeBoxActionHandler);
		
		// 退出/刷新事件; 只在退出时保存一次设置
		window.addEventListener("beforeunload", e=>{
			this.Settings.save();
		});
		// 关闭设置按钮时也保存
		this.uiElems["settingsToggleBtn"].addEventListener("settingsHide", e=>{
			this.Settings.save();
		});
		
		// 拦截按键事件
		window.addEventListener("keydown", this.pageInputHandler);
	}
	
	// 填充GUI初始状态
	initializeGUIState = (pinyinData)=>{
		// 填充包含项目data
		for(let pyCat of Object.entries(this.assets.pinyinData)){
			let settingBox = this.uiElems[pyCat[0] + "Settings"];
			
			for(let pyItem of pyCat[1]){
				// 显示
				let pyItemDisplay = pyItem.replace("v", "ü");
				
				let checkItem = document.createElement("div");
				let inputItem = document.createElement("input");
				let labelItem = document.createElement("label");
				
				checkItem.className = "checkItem";
				
				inputItem.type = "checkbox";
				inputItem.className = "pinyin-input settingcheckbox";
				inputItem.id = pyCat[0] + "-" + pyItem;
				inputItem.setAttribute("cat", pyCat[0]);
				inputItem.setAttribute("pinyin", pyItem);
				inputItem.id = pyCat[0] + "-" + pyItem;
				// 读取设置
				let isChecked = this.Settings.UIState.PinyinInclude[pyCat[0]][pyItem];
				inputItem.checked = isChecked ? true : false;
				
				labelItem.htmlFor = inputItem.id;
				labelItem.className = "settingLabel";
				labelItem.textContent = pyItemDisplay;
				
				checkItem.appendChild(inputItem);
				checkItem.appendChild(labelItem);
				
				settingBox.appendChild(checkItem);
			}
		}
		
		// 填充干扰项; 默认10
		let noiseLevel = this.Settings.UIState.Noise || 10;
		this.uiElems["noiseSlider"].value = noiseLevel;
		this.uiElems["noiseValueLabel"].label = "[" + noiseLevel + "%]";
		
		// 自动隐藏设置
		this.uiElems["autoHide"].checked = this.Settings.UIState.AutoHideSettings;
		
		// 读音提示设置
		this.uiElems["hint"].value = this.Settings.UIState.HintsThreshold;
		
		// 填充双拼方案data
		// 首次运行时激活第一个选项
		for(let plan of Object.entries(this.assets.planData.plans)){
			let planItem = document.createElement("option");
			planItem.value = plan[0];
			planItem.textContent = plan[1].name;
			this.uiElems["spPlan"].appendChild(planItem);
		}
		let activePlan = this.Settings.UIState.Plans.active;
		if(activePlan){
			this.uiElems["spPlan"].value = activePlan;
		} else {
			this.uiElems["spPlan"].selectedIndex = 0;
			// 设置index不会触发change事件
			this.uiElems["spPlan"].dispatchEvent(new Event("change", {bubbles: true}));
		}
	}
	
	// 页面输入事件处理
	pageInputHandler = e=>{
		// console.log(e); //debug
		
		let inputText = this.uiElems["inputTextarea"].textContent;
		let isPinyin = /^[a-zA-Z]$/.test(e.key);
		
		if(isPinyin && !e.altKey && !e.shiftKey && !e.ctrlKey){
			if(inputText.length >= 2){
				this.uiElems["inputTextarea"].textContent = "";
			}
			this.uiElems["inputTextarea"].textContent += e.key.toLowerCase();
			
			if(this.uiElems["inputTextarea"].textContent.length >= 2){
				// 输入框满时立即广播事件 inputTextareaSubmitEvent
				let submitEvent = new Event("inputTextareaSubmit");
				submitEvent.value = this.uiElems["inputTextarea"].textContent;
				this.uiElems["inputTextarea"].dispatchEvent(submitEvent);
			}
		} else if(e.key == "Backspace"){
			e.preventDefault();
			this.uiElems["inputTextarea"].textContent = inputText.substring(0, inputText.length -1);
		} else if(e.key == "Delete"){
			e.preventDefault();
			this.uiElems["inputTextarea"].textContent = inputText.substring(1);
		} else if(e.key == "Enter"){
			// pass 事件
			e.preventDefault();
			let submitEvent = new Event("inputTextareaSubmit");
			submitEvent.value = "act_pass";
			this.uiElems["inputTextarea"].dispatchEvent(submitEvent);
		} else if(e.key == "F1"){
			// 开关设置
			e.preventDefault();
			this.toggleSettings();
		} else if(e.key == "Escape"){
			// 关闭统计
			e.preventDefault();
			this.showStatsBox(false);
			this.showStatsRangeBox(false);
		}
		
	}
	
	// 设置变更事件处理
	// TODO 表驱动
	settingsChangeHandler = e=>{
		// console.log(e);//debug
		
		// 设置变更事件
		let settingsChangeEvent = new Event("settingsChange");
		settingsChangeEvent.oriTarget = e;
		settingsChangeEvent.group = "other";
		
		if(e.type == "change" && e.target.classList.contains("pinyin-input")){
			// 拼音包括选项
			let [cat, pinyin] = [e.target.getAttribute("cat"), e.target.getAttribute("pinyin")];
			this.Settings.UIState.PinyinInclude[cat][pinyin] = e.target.checked;
			settingsChangeEvent.group = "pinyinInclude";
			
		} else if(e.type == "change" && e.target.classList.contains("sp-plan-input")){
			// 双拼方案选项
			this.Settings.UIState.Plans.active = e.target.value;
			settingsChangeEvent.group = "spPlan";
			
		} else if(e.type == "change" && e.target.classList.contains("noise-input")){
			// 干扰项选项
			this.Settings.UIState.Noise = e.target.value;
			this.uiElems["noiseSlider"].title = e.target.value + "%";
			this.uiElems["noiseValueLabel"].label = "[" + e.target.value + "%]";
			settingsChangeEvent.group = "noise";
			
		} else if(e.type == "change" && e.target.classList.contains("auto-hide-input")){
			// 自动隐藏设置
			this.Settings.UIState.AutoHideSettings = e.target.checked;
			settingsChangeEvent.group = "autoHide";
			
		} else if(e.type == "change" && e.target.classList.contains("hint-input")){
			// 读音提示设置
			this.Settings.UIState.HintsThreshold = e.target.value;
			settingsChangeEvent.group = "hint";
			
		} else if(e.type == "click" && e.target.classList.contains("checkBtn")){
			// 拼音包括按钮
			let [cat, btnType] = [e.target.getAttribute("cat"), e.target.getAttribute("do")];
			let items = document.querySelectorAll(".settings ." + cat + " .checkItem .settingcheckbox");
			
			for(let item of items){
				switch (btnType){
					case "checkAll":
						item.checked = true;
						break;
					case "checkRevert":
						item.checked = !item.checked;
						break;
					case "checkNone":
						item.checked = false;
						break;
				}
				
				let pinyin = item.getAttribute("pinyin");
				this.Settings.UIState.PinyinInclude[cat][pinyin] = item.checked;
			}
			
			settingsChangeEvent.group = "checkBtn";
			
		} else if(e.type == "click" && e.target.classList.contains("statsBtn")){
			// 统计按钮
			let btnType = e.target.getAttribute("do");
			// 狠狠地转发
			settingsChangeEvent.detail = {action: btnType};
			settingsChangeEvent.group = "statsBtn";
			
			// 显示统计窗口
			if(btnType == "statsShow"){
				this.showStatsBox(true);
			}
		}
		
		// 广播设置变更事件
		this.uiElems["settings"].dispatchEvent(settingsChangeEvent);
	}
	
	// 统计窗口按钮事件处理
	// TODO 表驱动
	statsBoxActionHandler = e=>{
		// console.log("%o,%o", e.target, e);//debug
		
		// 统计窗口按钮事件
		let statsBoxActionEvent = new Event("statsBoxAction");
		let btnType = e.target.getAttribute("do");
		statsBoxActionEvent.oriTarget = e;
		statsBoxActionEvent.group = "other";
		statsBoxActionEvent.detail = {action: btnType};
		
		if(e.target.classList.contains("close")){
			// 关闭统计窗口
			this.showStatsBox(false);
			this.showStatsRangeBox(false);
			statsBoxActionEvent.group = "close";
			
		} else if(e.target.classList.contains("filterBtn")){
			// 先统一处理按钮按下特效
			for(let btn of this.uiElems["statsBoxBtns"].querySelectorAll(".filterBtn")){
				if(btn == e.target){
					btn.classList.add("active");
				} else {
					btn.classList.remove("active");
				}
			}
			
			// 统计按钮操作
			// 狠狠转发，让main提供需显示数据
			statsBoxActionEvent.group = "filterBtn";
		} else if(e.target.classList.contains("range")){
			// 开范围窗口, 并转发事件求灌注
			statsBoxActionEvent.group = "range";
			this.showStatsRangeBox(true);
		}
		
		// 广播统计窗口按钮事件
		this.uiElems["statsBox"].dispatchEvent(statsBoxActionEvent);
		
	}
	
	// 统计窗口范围按钮事件处理
	// TODO 表驱动
	statsRangeBoxActionHandler = e=>{
		// console.log("%o,%o", e.target, e);//debug
		
		// 统计窗口按钮事件
		let statsRangeBoxActionEvent = new Event("statsRangeBoxAction");
		let btnType = e.target.getAttribute("do");
		statsRangeBoxActionEvent.oriTarget = e;
		statsRangeBoxActionEvent.group = "other";
		statsRangeBoxActionEvent.detail = {action: btnType};
		
		if(e.target.classList.contains("cancel")){
			// 关闭统计范围窗口
			this.showStatsRangeBox(false);
			statsRangeBoxActionEvent.group = "cancel";
		} else if(e.target.classList.contains("reset")){
			// 重置范围为默认值 (最大范围)
			this.resetStatsRangeSelection();
			statsRangeBoxActionEvent.group = "reset";
		} else if(e.target.classList.contains("submit")){
			// 提交统计范围
			// 狠狠转发，然后关闭统计范围窗口
			// 需要刷新统计显示
			this.showStatsRangeBox(false);
			statsRangeBoxActionEvent.group = "submit";
		} else if(e.target.classList.contains("rangeBtn")){
			// 更改日期范围, rangeTo始终为今天
			this.uiElems["statsRangeDateTo"].value = this.uiElems["statsRangeDateTo"].max;
			// rangeTo始终为今天, rangeFrom默认为allTime
			let dateFromMin = this.uiElems["statsRangeDateFrom"].min;
			let dateFrom = dateFromMin;
			switch (btnType) {
				case "today":
					dateFrom = this.uiElems["statsRangeDateTo"].value;
					break;
				case "lastWeek":
					dateFrom = this.getOffsetISODate(dateFrom, -7);
					break;
				case "lastMonth":
					dateFrom = this.getOffsetISODate(dateFrom, -30);
					break;
				case "lastYear":
					dateFrom = this.getOffsetISODate(dateFrom, -365);
					break;
				case "allTime":
					// 取默认值
					break;
			}
			dateFrom = dateFrom <= dateFromMin ? dateFromMin : dateFrom;
			this.uiElems["statsRangeDateFrom"].value = dateFrom;
			statsRangeBoxActionEvent.group = "rangeBtn";
		}
		
		// 广播统计窗口按钮事件
		this.uiElems["statsRangeBox"].dispatchEvent(statsRangeBoxActionEvent);
	}
	
	// 更新汉字box
	updateHanziBox = (queue)=>{
		if(queue){
			queue.slice(-3).reverse().map((hanzi, pos)=>{
				this.updateHanzi(hanzi, pos);
			});
		}
	}
	
	// 汉字更新
	// hanziInfo，要显示的汉字info数组，长度超过1只显示第一个字
	// position = [0|1|2]，其余值或省略视为0
	// 当为 0 时，同时更新hint中的读音
	updateHanzi(hanziInfo, position){
		if(hanziInfo && hanziInfo.length > 1){
			hanziInfo = hanziInfo.at(0);
		}
		if(!position || position > 2){
			position = 0
		}
		this.uiElems["hanzi-" + (position + 1)].textContent = hanziInfo.hanzi;
		if(position == 0){
			this.uiElems["pinyinHint"].textContent = hanziInfo.pinyin.at(0);
		}
	}
	
	// 切换设置显示状态
	toggleSettings = ()=>{
		if(this.IsSettingsHidden){
			// 移除hidden标志
			this.uiElems["settings"].classList.remove("hidden");
		} else {
			// 否则添加hidden标志
			this.uiElems["settings"].classList.add("hidden");
			// 广播隐藏设置事件
			this.uiElems["settingsToggleBtn"].dispatchEvent(new Event("settingsHide"));
		}
	}
	
	// 显示/隐藏统计
	// TODO 清理这堆show
	showStatsBox = (isShow)=>{
		if(isShow){
			// 移除hidden标志
			this.uiElems["statsBox"].classList.remove("hidden");
		} else {
			// 否则添加hidden标志
			this.uiElems["statsBox"].classList.add("hidden");
		}
	}
	
	// 显示/隐藏统计范围窗口
	showStatsRangeBox = (isShow)=>{
		if(isShow){
			// 移除hidden标志
			this.uiElems["statsRangeBox"].classList.remove("hidden");
		} else {
			// 否则添加hidden标志
			this.uiElems["statsRangeBox"].classList.add("hidden");
		}
	}
	
	// 显示拼音提示
	showHint = (isShow)=>{
		if(isShow){
			this.uiElems["pinyinHint"].classList.remove("hidden");
		} else {
			this.uiElems["pinyinHint"].classList.add("hidden");
		}
	}
	
	// 填充统计数据
	updateStatsViewBox = (statsText)=>{
		this.uiElems["statsBoxViewBox"].value = statsText;
	}
	
	// 填充统计范围数据
	updateStatsRangeBox = (records)=>{
		let rangeInfo = this.getStatsRangeFromRecords(records);
		this.setStatsRange(rangeInfo);
	}
	
	// 从records中获取合法范围info(最大范围)
	getStatsRangeFromRecords = (records)=>{
		let rangeInfo = {
			timeFrom: Math.min(...records.map(r=>r.Timestamp)),
			timeTo: Math.max(...records.map(r=>r.Timestamp)),
			sessions: [...new Set(records.map(r=>r.SessionId))],
			sessionsCount: new Map()
		};
		// 各session包含的记录数
		rangeInfo.sessions.forEach(sessionId=>{
			rangeInfo.sessionsCount
				.set(sessionId.toString(), records.filter(rec=>rec.SessionId == sessionId).length);
		});
		return rangeInfo;
	}
	
	// 从gui获取当前统计viewbox选择的type
	getStatsViewBoxType = ()=>{
		return this.uiElems["statsBoxBtns"].querySelector(".active").getAttribute("do");
	}
	
	// 从gui获取范围设置
	getStatsRange = ()=>{
		let rangeInfo = {
			timeFrom: Date.parse(this.uiElems["statsRangeDateFrom"].value),
			timeTo: Date.parse(this.uiElems["statsRangeDateTo"].value),
			sessions: [...this.uiElems["statsRangeSession"].selectedOptions].map(opt=>opt.value),
			sessionsCount: new Map()
		}
		for(let opt of this.uiElems["statsRangeSession"].selectedOptions){
			rangeInfo.sessions.push(opt.value);
			rangeInfo.sessionsCount.set(opt.value, opt.getAttribute("count"));
		}
		return rangeInfo;
	}
	
	// 设置gui的范围设置
	setStatsRange = (rangeInfo)=>{
		// 限定input范围
		let minDate = this.timeStampToISODate(rangeInfo.timeFrom);
		let maxDate = this.timeStampToISODate(rangeInfo.timeTo);
		this.uiElems["statsRangeDateFrom"].min = minDate;
		this.uiElems["statsRangeDateTo"].min = minDate;
		this.uiElems["statsRangeDateFrom"].max = maxDate;
		this.uiElems["statsRangeDateTo"].max = maxDate;
		
		// 清除原option
		while(this.uiElems["statsRangeSession"].options.length > 0){
			this.uiElems["statsRangeSession"].remove(0);
		}
		let index = 1;
		for(let opt of rangeInfo.sessions.sort((a,b)=>b-a)){
			let sessionItem = document.createElement("option");
			sessionItem.value = opt;
			sessionItem.setAttribute("count", rangeInfo.sessionsCount.get(opt.toString()));
			sessionItem.text = index++ + ") " 
								+ new Date(opt).toLocaleDateString() + " "
								+ new Date(opt).toLocaleTimeString().substring(0,5) /* 20xx-xx-xx xx:xx*/
								+ " (" + rangeInfo.sessionsCount.get(opt.toString()) + "字)"
			this.uiElems["statsRangeSession"].add(sessionItem);
		}
		
		// 初始化选择
		this.resetStatsRangeSelection();
	}
	
	// 重置范围为默认值 (最大值)
	resetStatsRangeSelection = ()=>{
		// 默认选中全部时间范围
		this.uiElems["statsRangeDateFrom"].value = this.uiElems["statsRangeDateFrom"].min;
		this.uiElems["statsRangeDateTo"].value = this.uiElems["statsRangeDateTo"].max;
		// 默认全部选中
		for(let opt of this.uiElems["statsRangeSession"].options){
			opt.selected = true;
		}
	}
	
	// 形如: 1694077372877 → input[type=date]日期形如: 2023-09-07
	timeStampToISODate = (timestamp)=>{
		let t = new Date(timestamp);
		return new Date(t.getTime() - t.getTimezoneOffset() * 6e4).toISOString().substring(0, 10);
	}
	
	// 给input[type=date]形如 2023-09-07 增加日期 (负数为减少)
	getOffsetISODate = (date, offsetDates)=>{
		let newDate = new Date(date);
		newDate.setDate(newDate.getDate() + offsetDates);
		return this.timeStampToISODate(newDate.getTime());
	}
}