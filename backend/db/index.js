

const { Sequelize, Model, DataTypes } = require('sequelize');


class Token extends Model {


	static init(sequelize, REFRESH_TOKEN_VALIDITY_PERIOD) {
		super.init({
			refresh_token: {
				type: DataTypes.STRING,
				allowNull: false,
				unique: true,
			},
			user_info: {
				type: DataTypes.STRING,
				allowNull: false,
			},
			expires: {
				type: DataTypes.INTEGER,
				defaultValue: function() {
					return Date.now() + REFRESH_TOKEN_VALIDITY_PERIOD;
				}
			}
		}, { sequelize })
	}
}


async function init(options) {

	if (_global.initialized)
		return;

	const { 
		REFRESH_TOKEN_VALIDITY_PERIOD,
		DB_PATH,
	} = options;

	const storage = `${DB_PATH}/db.sqlite`;
	const sequelize = new Sequelize('', '', '', { 
		dialect: 'sqlite',
		storage,
		logging: false
	});

	Token.init(sequelize, REFRESH_TOKEN_VALIDITY_PERIOD);

	await sequelize.sync({ force: true });
	_global.initialized = true;

}


const _global = {};


module.exports = {
	Token,
	init,
}