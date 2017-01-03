function plural(singular, count) {
	if(count == 1) {
		return singular;
	}
	return singular+"s";
}

function stringList(list, def) {
	if(list.length === 0) {
		return def || "Do nothing";
	}
	var tr = "";
	for(var i = 0; i < list.length; i++) {
		if(tr.length > 0) {
			if(list.length > 2) {
				tr += ",";
			}
			tr += " ";
			if(i === list.length-1) {
				tr += "and ";
			}
		}
		tr += list[i];
	}
	return tr;
}

function Attack() {}
Attack.prototype.toString = function() {
	return '"'+this.type+'"';
};

var Attacks = {};

function newAttack(type, ctor, methods) {
	ctor.prototype = Object.create(Attack.prototype);
	ctor.prototype.type = type;
	for(var key in methods) {
		ctor.prototype[key] = methods[key];
	}
	Attacks[type] = ctor;
}

newAttack("normal", function(obj) {
		this.damage = obj.Damage || 0;
		this.guys = obj.Guys || 1;
		this.guyType = obj.GuyType || "bad";
	}, {
		toString: function() {
			var effects = [];
			if(this.damage > 0) {
				effects.push("Deal "+this.damage+"D");
			}
			if(this.damage < 0) {
				effect.push("Heal "+(-this.damage)+"D");
			}
			return stringList(effects)+" to "+this.guys+" "+this.guyType+" "+plural("guy", this.guys);
		}
	});

function Ability() {}
Ability.prototype.toString = function() {
	return '"'+this.type+'"';
};
Ability.unknown = function(type) {
	var tr = function() {};
	tr.prototype = Object.create(Ability.prototype);
	tr.prototype.type = type;
	return tr;
};

var Abilities = {};

function newAbility(type, ctor, methods) {
	ctor.prototype = Object.create(Ability.prototype);
	ctor.prototype.type = type;
	for(var key in methods) {
		ctor.prototype[key] = methods[key];
	}
	Abilities[type] = ctor;
}

newAbility("weakershield", function(obj) {
	this.damage = obj.Damage || 1;
	this.min = obj.Minimum || 1;
}, {
	toString: function() {
		return "When attacked, take "+this.damage+" less damage, but not less than "+this.min;
	}
});

function Guy(id, obj) {
	this.id = id;
	this.attack = [];
	this.ability = [];
	this.name = obj.Name || "Unnamed";
	this.health = obj.Health || 1;
	if(obj.Attack) {
		obj.Attack = obj.Attack || [];
		if(!Array.isArray(obj.Attack)) {
			obj.Attack = [obj.Attack];
		}
		for(var i = 0; i < obj.Attack.length; i++) {
			var cur = obj.Attack[i];
			var newAtk = new (Attacks[cur.Base || cur.Type] || Attack)(cur);
			this.attack.push(newAtk);
		}
		if(typeof obj.Ability === "string") {
			obj.Ability = {Base: obj.Ability};
		}
		obj.Ability = obj.Ability || [];
		if(!Array.isArray(obj.Ability)) {
			obj.Ability = [obj.Ability];
		}
		for(var i = 0; i < obj.Ability.length; i++) {
			var cur = obj.Ability[i];
			var newA = new (Abilities[cur.Base || cur.Type] || Ability.unknown(cur.Base || cur.Type))(cur);
			this.ability.push(newA);
		}
	}
};

Guy.prototype.attackString = function() {
	if(this.attack.length < 1) return "";
	var strings = [];
	for(var i = 0; i < this.attack.length; i++) {
		strings.push(this.attack[i].toString());
	}
	return "Attack: "+stringList(strings)+".";
};

Guy.prototype.abilityString = function() {
	if(this.ability.length < 1) return "";
	var strings = [];
	for(var i = 0; i < this.ability.length; i++) {
		strings.push(this.ability[i].toString());
	}
	return "Ability: "+stringList(strings)+".";
};

module.exports = {
	Guy: Guy,
	Attacks: Attacks
};
