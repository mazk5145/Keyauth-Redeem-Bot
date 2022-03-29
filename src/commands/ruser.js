const { SlashCommandBuilder } = require("@discordjs/builders");
const Discord = require("discord.js");
const fetch = require('node-fetch')
const db = require('quick.db');


async function generate (count = 8) {
    let password = ''
    while (password.length < count) {
      password += Math.random().toString(36).substr(2)
    }
    return password.substr(0, count)
  }

async function generaterandomname(length) {
    var randomChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var result = '';
    for ( var i = 0; i < length; i++ ) {
        result += randomChars.charAt(Math.floor(Math.random() * randomChars.length));
    }
    return result;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ruser")
        .setDescription("Redeem User + Pass from license")
        .addStringOption((option) => 
            option
                .setName("license")
                .setDescription("Your license key that you wan't to redeem.")
                .setRequired(true)
        ),
    
    async execute(interaction, client) {

        let sellerkey = await db.get(`token_${interaction.guild.id}`)
        if(sellerkey === null) return interaction.reply({ embeds: [new Discord.MessageEmbed().setDescription(`Seller key haven't been setupped!`).setColor("RED").setTimestamp()], ephemeral: true, });

        let key = interaction.options.getString("license")
        let un = await generaterandomname(10);
        let pw = await generate();

        function checkResponseStatus(res) {
            if(res.ok){
                genaccforlicense(interaction);
            } else {
                const channel = interaction.guild.channels.cache.find(channel => channel.name === 'prebeta-logs');
        
                interaction.reply({
                    embeds: [new Discord.MessageEmbed().setTitle('License Key Not Found').setColor("RED")],
                    ephemeral: true,
                });
        
                if (channel) {
                    channel.send({
                        embeds: [new Discord.MessageEmbed().setAuthor({ name: "Wrong Key ALERT" }).addField('License:', "```" + `${key}` + "```", inline = false).addField('Discord:', interaction.member.user.username, inline = true).addField('DiscordID:', "```" + interaction.member.user.username + "```", inline = true).setColor("RED").setFooter({ text: "KeyAuth Redeem Bot v1.6.2" }).setTimestamp()]
                    });
                }
        }}

        function genaccforlicense(interaction) {
            fetch(`https://keyauth.` + client.domain + `/api/seller/?sellerkey=${sellerkey}&type=activate&user=${un}&key=${key}&pass=${pw}&format=text`)
            .then(res => res.text())
            .then(text => {
                interaction.reply({
                    embeds: [new Discord.MessageEmbed().setTitle('License Successfully Activated!').setFooter({ text: "KeyAuth Redeem Bot v1.6.2" }).addField('Username:', "```" + un + "```").addField('Password', "```" + pw + "```").addField('License:', "```" + `${key}` + "```").setColor("#5b09b3").setTimestamp()], 
                    ephemeral: true,
                })

                fetch(`https://keyauth.` + client.domain + `/api/seller/?sellerkey=${sellerkey}&type=info&key=${key}`)
                .then(res => res.json())
                .then(json => {
                    const channel = interaction.guild.channels.cache.find(channel => channel.name === 'prebeta-logs');
        
                    if (channel) {
                        channel.send({
                            embeds: [new Discord.MessageEmbed().setAuthor({ name: "License Redeemed ALERT" }).addField('License:', "```" + `${key}` + "```", inline = false).addField('Username:', "```" + un + "```", true).addField('Password', "```" + pw + "```", true).addField(`License Expiry:`, "```" + `${json['expiry']}` + "```").addField('Level:', "```" + `${json['level']}` + "```").addField('Created By:', "```" + `${json['createdby']}` + "```").addField('Created On:', "```" + `${json['creationdate']}` + "```").addField('Discord:', "```" + interaction.member.user.username + "```", inline = true).addField('DiscordID:', "```" + interaction.member.user.id + "```", inline = true).setColor("GREEN").setFooter({ text: "KeyAuth Redeem Bot v1.6.2" }).setTimestamp()],
                            ephemeral: false,
                        })
                    }
                })

                disableoldlicense();
            })
        }

        function disableoldlicense() {
            fetch(`https://keyauth.` + client.domain + `/api/seller/?sellerkey=${sellerkey}&type=del&key=${key}`);
        }

        fetch(`https://keyauth.` + client.domain + `/api/seller/?sellerkey=${sellerkey}&type=verify&key=${key}`)
        .then(checkResponseStatus);
    },
};