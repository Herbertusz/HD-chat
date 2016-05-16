/* global appRoot */

'use strict';

var HD = require(`${appRoot}/libs/hd/hd.datetime.js`);

var Model = function(db){

	var DB = db;

	return {

		getUsers : function(callback){
			db.collection("chat_users")
				.find({"active" : true})
				.sort({"username" : 1})
				.toArray(function(error, docs){
					if (error) throw error;
					docs.forEach(function(doc, i){
						docs[i].created = HD.DateTime.format('Y-m-d H:i:s', Math.floor(Date.parse(doc.created) / 1000));
					});
					callback.call(this, docs);
				});
		},

		getRoomMessages : function(roomName, callback){
			DB.query(`
				SELECT
					cm.id AS messageId,
					cm.user_id AS userId,
					cm.room,
					cm.file_id AS fileId,
					cm.message,
					cm.created,
					cf.name AS fileName,
					cf.size AS fileSize,
					cf.type AS fileType,
					cf.main_type AS fileMainType,
					cf.store AS fileStore,
					cf.base64 AS fileBase64,
					cf.zip AS fileZip,
					cf.url AS fileUrl,
					cf.deleted AS fileDeleted,
					cu.username AS userName
				FROM
					chat_messages cm
					LEFT JOIN chat_files cf ON cm.file_id = cf.id
					LEFT JOIN chat_users cu ON cm.user_id = cu.id
				WHERE
					cm.room = :roomName
				ORDER BY
					cm.created ASC
			`, {
				roomName : roomName
			}, function(error, rows){
				if (error) throw error;
				rows.forEach(function(row, i){
					rows[i].created = HD.DateTime.format('Y-m-d H:i:s', Math.floor(Date.parse(row.created) / 1000));
					rows[i].fileDeleted = !!rows[i].fileDeleted;
				});
				callback.call(this, rows);
			});
		},

		setMessage : function(data, callback){
			let messageId;
			DB.insert('chat_messages', {
				'user_id' : data.userId,
				'room' : data.room,
				'file_id' : data.fileId,
				'message' : data.message,
				'created' : HD.DateTime.format('Y-m-d H:i:s', data.time)
			}, function(error, result){
				if (error) throw error;
				messageId = result.insertId;
				callback.call(this, messageId);
			});
		},

		setFile : function(data, callback){
			const This = this;
			const messageForFile = function(fdata, fileId){
				This.setMessage({
					'userId' : fdata.userId,
					'room' : fdata.room,
					'fileId' : fileId,
					'message' : null,
					'created' : HD.DateTime.format('Y-m-d H:i:s', fdata.time)
				}, function(messageId){
					callback.call(this, fileId, messageId);
				});
			};

			if (data.store === 'upload'){
				DB.insert('chat_files', {
					'name' : data.fileData.name,
					'size' : data.fileData.size,
					'type' : data.fileData.type,
					'main_type' : data.mainType,
					'store' : data.store,
					'url' : data.file,
					'deleted' : 0
				}, function(error, result){
					if (error) throw error;
					messageForFile(data, result.insertId);
				});
			}
			else if (data.store === 'base64'){
				DB.insert('chat_files', {
					'name' : data.fileData.name,
					'size' : data.fileData.size,
					'type' : data.fileData.type,
					'main_type' : data.mainType,
					'store' : data.store,
					'base64' : data.file,
					'deleted' : 0
				}, function(error, result){
					if (error) throw error;
					messageForFile(data, result.insertId);
				});
			}
			else if (data.store === 'zip'){
				data.file.forEach(function(element, index, arr){
					arr[index] += 128;
				});
				DB.query(`
					INSERT INTO chat_files
					(name, size, type, main_type, store, zip) VALUES
					(:name, :size, :type, :main_type, :store, CHAR(${data.file}))
				`, {
					'name' : data.fileData.name,
					'size' : data.fileData.size,
					'type' : data.fileData.type,
					'main_type' : data.mainType,
					'store' : data.store,
					'deleted' : 0
				}, function(error, result){
					if (error) throw error;
					messageForFile(data, result.insertId);
				});
			}
		},

		deleteFile : function(roomName, callback){
			DB.query(`
				SELECT
					cf.id AS id,
					cf.url AS fileUrl
				FROM
					chat_messages cm
					LEFT JOIN chat_files cf ON cm.file_id = cf.id
				WHERE
					cm.room = :roomName
			`, {
				roomName : roomName
			}, function(error, rows){
				if (error) throw error;
				const urls = [];
				rows.forEach(function(row){
					urls.push(row.fileUrl);
					DB.query(`
						UPDATE
							chat_files
						SET
							deleted = 1
						WHERE
							id = :id
					`, {
						id : row.id
					});
				});
				callback.call(this, urls);
			});
		}

	};

};

module.exports = Model;
