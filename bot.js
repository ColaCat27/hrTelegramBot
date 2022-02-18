require('dotenv').config();

const { Telegraf, session, Scenes: { WizardScene, Stage } } = require('telegraf');

const saveData = require('./services/saveData');

const bot = new Telegraf(process.env.TOKEN);


const mainScene = new WizardScene(
	'candidate',
    (ctx) => {
		try {
			ctx.reply('Введите фамилию:');
			return ctx.wizard.next();
		} catch(e) {
			console.error(e);
			return ctx.scene.reenter();
		}

    },
	(ctx) => {
		try {
			if(ctx.message.text.length < 2 || /[^A-zА-я \-\s]/.test(ctx.message.text)) {
				throw new Error();
			}
			ctx.wizard.state.lastName = ctx.message.text;
			ctx.reply('Введите имя:');
			return ctx.wizard.next();
		} catch(e) {
			console.error(e);
			ctx.reply('Вы ввели неправильные данные, введите фамилию повторно');
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		}
	},
	(ctx) => {
		console.log(ctx);
		try {
			if(ctx.message.text.length < 2 || /[^A-zА-я \-\s]/.test(ctx.message.text)) {
				throw new Error();
			} else {
				ctx.wizard.state.firstName = ctx.message.text;
				ctx.reply('Дата рождения (дд.мм.гггг):');
				return ctx.wizard.next();
			}
		} catch(e) {
			console.error(e);
			ctx.reply('Вы ввели неправильные данные, введите имя повторно');
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		}
	},
	(ctx) => {
		try {
			let limit = new Date().getFullYear() - 15;
			if(!/\d+\.\d+\.\d+/.test(ctx.message.text)) {
				throw new Error();
			} else {
				let date = ctx.message.text.split('.');
				if(date[0].length > 2 || date[1].length > 2 || date[2].length > 4) {
					throw new Error();
				} else if(date[2] < 1950 || date[2] > limit) {
					throw new Error();
				} else if(date[0] <= 0 || date[0] > 31) {
					throw new Error();
				} else if(date[1] <= 0 || date[1] > 12) {
					throw new Error();
				}
			}
			ctx.wizard.state.date = ctx.message.text;
			 ctx.reply('Выберите город проживания (Если города нету в списке, введите его сами):', {
				reply_markup: {
					inline_keyboard: [
						[
							{ text: 'Москва', callback_data: 'Москва' },
							{ text: 'СПБ', callback_data: 'СПБ' }
						],
					],
				},
			});
			return ctx.wizard.next();
		} catch(e) {
			console.error(e);
			ctx.reply('Вы ввели неправильные данные, введите дату повторно, пример: 11.10.2000');
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		}
	},
    (ctx) => {
		 try {
			if(ctx.message) {
				if(/[^A-zА-я \-\s]/.test(ctx.message.text)) {
					throw new Error();
				} else {
					ctx.wizard.state.city = ctx.message.text;
				}

			} else {
				   ctx.wizard.state.city = ctx.update.callback_query.data;
		   }
		   ctx.reply('Уровень английского:', {
			   reply_markup: {
				   inline_keyboard: [
					   [{ text: 'Beginner (A0)', callback_data: 'Beginner (A0)' }],
					   [{ text: 'Elementary (A1)', callback_data: 'Elementary (A1)' }],
					   [{ text: 'Pre Intermediate (A2)', callback_data: 'Pre Intermediate (A2)' }],
					   [{ text: 'Intermediate (B1)', callback_data: 'Intermediate (B1)' }],
					   [{ text: 'Upper Intermediate (B2)', callback_data: 'Upper Intermediate (B2)' }],
					   [{ text: 'Advanced (C1)', callback_data: 'Advanced (C1)' }],
					   [{ text: 'Proficient (C2)', callback_data: 'Proficient (C2)' }],
				   ],
			   },
		   });
		   return ctx.wizard.next();
		 } catch(e) {
			 console.error(e);
			 ctx.reply('Вы ввели неправильные данные, выберите адрес или введите повторно');
			 ctx.wizard.selectStep(ctx.wizard.cursor);
			 return;
		 }

    },
	(ctx) => {
		try {
			if(ctx.message) {
				throw new Error();
			}
			ctx.wizard.state.englishLevel = ctx.update.callback_query.data;
			ctx.reply('Опишите предыдущий опыт работы (До 500 символов):');
			return ctx.wizard.next();
		} catch(e) {
			console.error(e)
			ctx.reply('Вы не выбрали уровень английского, пожалуйста выберите уровень повторно');
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		} 

	},
	(ctx) => {
		try {
			if(ctx.message.text.length > 500) {
				throw new Error();
			}
			ctx.wizard.state.previousExp = ctx.message.text;
			ctx.reply("Ваш мобильный номер (Необязательно)", {
				reply_markup: {
				  keyboard: [
					[
					  {
						text: "Отправить мобильный номер",
						request_contact: true,
					  }
					],
					[
						{
							text: "Не отправлять"
						}
					]
				  ],
				  one_time_keyboard: true,
				  resize_keyboard: true
				},
			  })
			  return ctx.wizard.next();
		} catch(e) {
			console.error(e);
			ctx.reply('Пожалуйста введите не больше 500 символов.');
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		}
	},
	(ctx) => {
		try {
			if(ctx.message.contact) {
				ctx.wizard.state.phone = ctx.message.contact.phone_number;
			}
			if(ctx.update.message.from.username) {
				ctx.wizard.state.username = ctx.update.message.from.username;
			} else {
				ctx.wizard.state.username = "";
			}
			if(ctx.update.message.from.first_name) {
				ctx.wizard.state.tgName = ctx.update.message.from.first_name;
			} else {
				ctx.wizard.state.tgName = "";
			}
			if(ctx.update.message.from.last_name) {
				ctx.wizard.state.tgLastName = ctx.update.message.from.last_name;
			} else {
				ctx.wizard.state.tgLastName = "";
			}
			
			ctx.reply('Спасибо что заполнили анкету!👍');
			saveData(ctx.wizard.state);
			return ctx.wizard.next();
		} catch(e) {
			console.error(e);
			return ctx.wizard.next();
		}

	},
	(ctx) => {
		ctx.scene.leave();
	}
);

const stage = new Stage([mainScene]);

bot.use(session());
bot.use(stage.middleware());


bot.start(async (ctx) => {
    await ctx.reply('Привет, ответьте пожалуйста на несколько вопросов.');
    ctx.scene.enter('candidate');
});

bot.help((ctx) => {
	ctx.reply('Введите /start для заполнения анкеты')
})

bot.launch();
