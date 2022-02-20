require('dotenv').config();

const { Telegraf, session, Scenes: { WizardScene, Stage } } = require('telegraf');

const saveData = require('./services/saveData');
const errors = require('./services/errors');

const bot = new Telegraf(process.env.TOKEN);

const mainScene = new WizardScene(
	'candidate',
    (ctx) => {
		try {
			ctx.reply('Введите фамилию:');
			return ctx.wizard.next();
		} catch(e) {
			console.error(e.message);
			return ctx.scene.reenter();
		}

    },
	(ctx) => {
		try {
			if(ctx.message.text.length < 2) {
				throw new Error('Ответ не может содержать одну букву. Пожалуйста введите ответ повторно');
			} else if(/[^A-zА-я \-\s]/.test(ctx.message.text)) {
				throw new Error('Ответ не может содержать спец. символы, пустую строку или цифры. Пожалуйста введите ответ повторно');
			}
			ctx.wizard.state.lastName = ctx.message.text;
			ctx.reply('Введите имя:');
			return ctx.wizard.next();
		} catch(e) {
			console.error(e.message);
			ctx.reply(e.message);
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		}
	},
	(ctx) => {
		try {
			
			if(ctx.message.text.length < 2) {
				throw new Error('Ответ не может содержать одну букву. Пожалуйста введите ответ повторно');
			} else if(/[^A-zА-я \-\s]/.test(ctx.message.text)) {
				throw new Error('Ответ не может содержать спец. символы, пустую строку или цифры. Пожалуйста введите ответ повторно');
			}

			ctx.wizard.state.firstName = ctx.message.text;
			ctx.reply('Дата рождения (дд.мм.гггг):');
			return ctx.wizard.next();
		} catch(e) {
			console.error(e.message);
			ctx.reply(e.message);
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		}
	},
	(ctx) => {
		try {
			let limit = new Date().getFullYear() - 10;
			if(!/\d+\.\d+\.\d+/.test(ctx.message.text)) {
				throw new Error('Ответ должен содержать дату в формате дд.мм.гггг, (пример: 10.10.1984). Пожалуйста введите дату повторно');
			} else {
				let date = ctx.message.text.split('.');
				if(date[0].length > 2 || date[1].length > 2 || date[2].length > 4) {
					throw new Error('Ответ должен содержать дату в формате дд.мм.гггг, (пример: 10.10.1984). Пожалуйста введите дату повторно');
				} else if(date[2] < 1950 || date[2] > limit) {
					throw new Error(`Год не может быть меньше 1950 или больше ${limit}. Пожалуйста введите дату повторно`);
				} else if(date[0] <= 0 || date[0] > 31) {
					throw new Error('День не может быть 0 или больше 31. Пожалуйста введите дату повторно');
				} else if(date[1] <= 0 || date[1] > 12) {
					throw new Error('Месяц не может быть 0 или больше 12. Пожалуйста введите дату повторно');
				}
			}
			ctx.wizard.state.date = ctx.message.text;
			 ctx.reply('Выберите город проживания (Если города нету в списке, введите его сами):', {
				reply_markup: {
					inline_keyboard: [
						[
							{ text: 'Москва', callback_data: 'Москва' },
							{ text: 'Санкт-Петербург', callback_data: 'Санкт-Петербург' }
						],
					],
				},
			});
			return ctx.wizard.next();
		} catch(e) {
			console.error(e.message);
			ctx.reply(e.message);
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		}
	},
    (ctx) => {
		 try {
			if(ctx.message) {
				if(/[^A-zА-я \-\s]/.test(ctx.message.text)) {
					throw new Error('Название города не может содержать спец. символы. Пожалуйста введите название повторно');
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
			 console.error(e.message);
			 ctx.reply(e.message);
			 ctx.wizard.selectStep(ctx.wizard.cursor);
			 return;
		 }

    },
	(ctx) => {
		try {
			if(ctx.message) { 
				throw new Error('Вы не выбрали уровень английского. Пожалуйста выберите ответ повторно');
			}
			ctx.wizard.state.englishLevel = ctx.update.callback_query.data;
			ctx.reply('Опишите предыдущий опыт работы (От 100 до 500 символов):', {
				reply_markup: {
					keyboard: [
						[
							{
								text: "У меня нету опыта работы"
							}
						]
					],
					one_time_keyboard: true,
					resize_keyboard: true
				}
			});
			return ctx.wizard.next();
		} catch(e) {
			console.error(e)
			ctx.reply(e.message);
			ctx.wizard.selectStep(ctx.wizard.cursor);
			return;
		} 

	},
	(ctx) => {
		try {
			if(ctx.message.text != "У меня нету опыта работы") {
				if(ctx.message.text.length < 100) {
					throw new Error('Ответ не может быть меньше 100 символов. Пожалуйста введите более развернутый ответ (Не более 500 символов)'); 
				} 
				if(ctx.message.text.length > 500) { 
					throw new Error('Ответ не может быть больше 500 символов. Пожалуйста введите более короткий ответ (Не менее 100 символов)'); 
				}
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
			console.error(e.message);
			ctx.reply(e.message);
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
			console.error(e.message);
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
