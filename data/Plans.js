class Plans{
	ver = "0.1.42";
	
	Plans = null;
	ActivePlan = null;
	
	#regexqp = null;
	#regexspyj = null;
	
	constructor(planData){
		if(planData){
			this.Plans = planData.plans;
		};
	}
	
	// 设置激活方案
	setActivePlan = (name)=>{
		this.ActivePlan = this.Plans[name] || null;
		let longFirstCompFn = (a,b)=>{return a.length < b.length ? 1 : -1};
		
		if(this.ActivePlan){
			// /^(声母)(韵母)$|^(单音节)$/
			this.regexqp = new RegExp(
				"^(?<sm>"
					+ Object.entries(this.ActivePlan.sm)
						.map(([qp,sp])=>qp)
						.sort(longFirstCompFn)
						.join("|")
					+ ")(?<ym>"
					+ Object.entries(this.ActivePlan.ym)
						.map(([qp,sp])=>qp)
						.sort(longFirstCompFn)
						.join("|")
				+ ")$|^(?<yj>"
					+ Object.entries(this.ActivePlan.yj)
						.map(([qp,sp])=>qp)
						.sort(longFirstCompFn)
						.join("|")
				+ ")$"
			);
			
			// /^(单音节)$/
			this.regexspyj = new RegExp(
				"^("
				+ Object.entries(this.ActivePlan.yj)
					.map(([qp,sp])=>sp)
					.sort(longFirstCompFn)
					.join("|")
				+ ")$"
			)
		}
	}
	
	// 获取详细拼音信息
	getPinyinInfo(pinyinStr){
		// type - 单音节时为yj, 普通拼音为full，无效拼音为none
		// value - 简写的全拼
		// sm - 声母，单音节时为""
		// ym - 韵母，单音节时为该音节
		let simplifiedPinyinStr = Hanzi.parsePinyin(pinyinStr);
		let pinyinInfo = {
			type: "none",
			value: simplifiedPinyinStr,
			sm: "",
			ym: ""
		}
		let match = simplifiedPinyinStr.match(this.regexqp);
		if(match && match.groups["yj"]){
			pinyinInfo.type = "yj";
			pinyinInfo.ym = match.groups["yj"];
		} else if (match && match.groups["sm"] && match.groups["ym"]){
			pinyinInfo.type = "full";
			pinyinInfo.sm = match.groups["sm"];
			pinyinInfo.ym = match.groups["ym"];
		}
		return pinyinInfo;
	}
	
	// 双拼to全拼
	// 返回值为数组，组合可能不唯一
	s2q = (sppinyin)=>{
		let pinyins = [];
		if(this.ActivePlan){
			let isyj = this.regexspyj.test(sppinyin);
			if(isyj){
				// 音节组合唯一
				pinyins = Object.entries(this.ActivePlan.yj)
							.filter(([qp,sp])=>sp==sppinyin)
							.map(([qp,sp])=>qp);
			} else {
				let sms = Object.entries(this.ActivePlan.sm)
							.filter(([qp,sp])=>sp==sppinyin.charAt(0))
							.map(([qp,sp])=>qp);
				let yms = Object.entries(this.ActivePlan.ym)
							.filter(([qp,sp])=>sp==sppinyin.charAt(1))
							.map(([qp,sp])=>qp);
				for(let sm of sms){
					for(let ym of yms){
						pinyins.push(sm + ym);
					}
				}
			}
		}
		
		return pinyins;
	}
	// 全拼to双拼
	// 返回值为string，组合唯一
	q2s = (pinyin)=>{
		let sppinyin = "";
		if(this.ActivePlan){
			let pinyinInfo = this.getPinyinInfo(pinyin);
			if(pinyinInfo.type == "full"){
				sppinyin = this.ActivePlan.sm[pinyinInfo.sm]
						+ this.ActivePlan.ym[pinyinInfo.ym];
			} else if(pinyinInfo.type == "yj"){
				sppinyin = this.ActivePlan.yj[pinyinInfo.ym];
			}
		}
		
		return sppinyin;
	}
	
}