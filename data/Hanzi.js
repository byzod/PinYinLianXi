class Hanzi{
	ver = "0.1.31";
	
	Queue = null;
	Settings = null;
	
	#hanziData = null;
	#pinyinData = null;
	
	static rawpinyinReplaceRule = [
		["üan", "uan"],
		["ün", "un"],
		["üe", "ve"],
		["ü", "v"],
	];
	
	get NoiseRatio (){
		let val = this.Settings ? this.Settings.UIState.Noise : 0;
		val = val < 0 ? 0 : val/100;
		return val;
	}
	
	constructor({settings: settingsShared, assets: assets}){
		this.Queue = [];
		this.Settings = settingsShared || null;
		this.hanziData = assets.hanziData || null;
		this.pinyinData = assets.pinyinData || null;
	}
	
	// 拼音归一化
	static parsePinyin(rawpinyin){
		let simplifiedPinyin = "";
		simplifiedPinyin = rawpinyin;
		Hanzi.rawpinyinReplaceRule.forEach(rule=>{
			simplifiedPinyin=simplifiedPinyin.replace(rule[0], rule[1]);
		});
		return simplifiedPinyin;
	}
	
	// 按汉字获取汉字info数组
	getHanziInfoByHanzi(hanzi){
		let hanziInfos = [];
		hanziInfos = this.hanziData.popular
			.filter(info=>info.hanzi == hanzi);
		return hanziInfos;
	}
	
	// 按拼音获取汉字info数组
	getHanziInfoByPinyin(rawpinyins){
		let hanziInfos = [];
		let pinyins = rawpinyins.map(p=>Hanzi.parsePinyin(p));
		// 对多音字，仅以最常见的读音检索
		hanziInfos = this.hanziData.popular
			.filter(info=>pinyins.includes(info.pinyin[0]));
		return hanziInfos;
	}
	
	// 根据设置生成queue
	getQueue(length = 100){
		this.Queue = this.genQueue(length);
		return this.Queue
	}
	
	// 在现有queue前增加
	addQueue(length = 100) {
		this.Queue = this.genQueue(length).concat(this.Queue);
	}
	
	// 生成并返回queue
	genQueue(length = 100) {
		let queue = [];
		let pinyinInclude = {};
		let st = Date.now();
		
		// 获得包含的声母韵母音节数组
		["shengmu", "yunmu", "yinjie"].map(name=>{
			pinyinInclude[name] = Object.entries(this.Settings.UIState.PinyinInclude[name])
				.filter(([p, isInclude])=>isInclude)
				.map(([p, isInclude])=>p);
		});
		
		// 按包含的声母韵母音节数组生成所有拼音组合
		let rawCombinations = [];
		pinyinInclude.shengmu
			.forEach(sm=>{
				pinyinInclude.yunmu
					.forEach(ym=>rawCombinations.push(sm + ym))
			});
		rawCombinations = rawCombinations.concat(pinyinInclude.yinjie);
		
		// TODO 此处应有filter剔除pinyinCombination中无效组合，但是 摸了
		queue = this.getHanziInfoByPinyin(rawCombinations);
		
		// 截取length长度结果(或全部，如果结果太少)，并留出干扰项空位
		length = Math.round(Math.min(queue.length/(1 - this.NoiseRatio), length));
		queue = this.getShuffleArray(queue, length * (1 - this.NoiseRatio));
		// 加入干扰项
		queue = queue.concat(this.genRandomQueue(length * this.NoiseRatio));
		// 揉巴揉巴
		queue = this.getShuffleArray(queue);
		
		// console.log(`Hanzi.genQueue(${length}), time: ${Date.now() - st} ms`);// debug
		return queue
	}
	
	// 生成随机汉字queue
	genRandomQueue(length = 100){
		return this.getShuffleArray(this.hanziData.popular, length);
	}
	
	// 洗牌数组并返回指定长度
	getShuffleArray(arr, length = arr.length){
		length = length >= 0 ? length : 0;
		length = Math.min(length, arr.length);
		
		// 只需要shuffle前length个元素
		for(let i = 0; i < length; i++){
			let rnd = Math.floor(Math.random() * arr.length);
			[arr[i], arr[rnd]] = [arr[rnd], arr[i]];
		}
		
		return arr.slice(0, length);
	}
}