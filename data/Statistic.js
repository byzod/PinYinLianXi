class Statistic {
	ver = "0.1.6";
	
	Stats = null;
	RangeInfo = null;
		
	constructor(){
		this.Stats = new Map();
		this.RangeInfo = null;
	}
	
	// 分析records
	getStats = (records)=>{
		this.Stats = new Map();
		
		// 按范围限定过滤，如果没有则视为全部
		if(this.RangeInfo){
			records = records.filter(item=>{
				// timeFrom 和 timeTo 精度只到1天，得加钱
				return (item.Timestamp >= this.RangeInfo.timeFrom)
					&& (item.Timestamp <= this.RangeInfo.timeTo + 86399999)
					&& (this.RangeInfo.sessions.includes(item.SessionId.toString()));
			});
		}
		
		for(let rec of records){
			// 音节视作韵母
			let types = ["sm", "ym"];
			let stat = null;
			// 声母,韵母,音节是否正确
			let isCorrectArr = {
				sm: rec.PinyinInfo.type == "full" && (rec.Input[0] == rec.InputExpect[0]), 
				ym: rec.PinyinInfo.type == "full" && (rec.Input[1] == rec.InputExpect[1]), 
				yj: rec.PinyinInfo.type == "yj" && (rec.Input == rec.InputExpect)
			};
			
			for(let type of types){
				let realType = rec.PinyinInfo.type == "yj" ? "yj" : type;
				let yjSuffix = realType == "yj" ? "*" : "";
				// 该音素是否正确
				let isCorrect = isCorrectArr[realType];
				
				if(this.Stats.has(rec.PinyinInfo[type] + yjSuffix)){
					// 已有的加计数
					stat = this.Stats.get(rec.PinyinInfo[type] + yjSuffix);
					stat.oui += isCorrect ? 1 : 0;
					stat.tot += 1;
					// 好像可以直接修改不需要重新设置
					// this.Stats.set(rec.PinyinInfo[type] +  + yjSuffix, stat);
				} else if(rec.PinyinInfo[type]) {
					// 没有的就新建
					stat = new StatItem(realType, isCorrect ? 1 : 0, 1);
					this.Stats.set(rec.PinyinInfo[type] + yjSuffix, stat);
				}
			}
		}
		return this.Stats;
	}
	
	// 形成报告文本
	// type [string]
	// 		all	全部
	// 		sm	声母
	// 		ym	韵母
	// 		yj	音节
	getStatsText = (type)=>{
		let report = "";
		if(this.Stats){
			let typesInclude = type == "all" ? ["sm", "ym", "yj"] : [type];
			let statsArr = Array.from(this.Stats);
			
			// 挑选限定类型
			statsArr = statsArr.filter(([k,v])=>typesInclude.includes(v.type));
			// 然后按次数从高到低排序
			// 默认排序好像是非稳定的所以其实没什么卵用
			statsArr.sort((a,b)=>{return b[1].tot - a[1].tot});
			// 最后再按正确率从低到高排序 (以1%精度)
			statsArr.sort((a,b)=>{return (a[1].ouiRatio - b[1].ouiRatio).toFixed(2)});
			
			// 表头
			report += "音素\t正确率\t正确/总数\n";
			report += "——————————————————————————\n";
			// 总计
			let ouiTot = statsArr.reduce((tot, cur)=>tot += cur[1].oui, 0);
			let totTot = statsArr.reduce((tot, cur)=>tot += cur[1].tot, 0);
			report += "总计\t"
					+ (((ouiTot/totTot) * 100).toFixed(0)).replace("NaN", "--") + "%\t"
					+ (ouiTot) + "/"
					+ (totTot) + "\n";
			// 分项
			for(let ent of statsArr){
				report += `${ent[0].replace("v", "ü")} \t${(ent[1].ouiRatio*100).toFixed(0)}%\t${ent[1].oui} / ${ent[1].tot}\n`;
			}
		}
		return report;
	}
}

class StatItem {
	type = "";
	oui = -1;
	tot = -1;
	
	get ouiRatio (){
		return this.tot == 0 ? 0 : this.oui / this.tot;
	}
	
	constructor(type, oui = 0, tot = 0){
		this.type = type;
		this.oui = oui;
		this.tot = tot;
	}
}