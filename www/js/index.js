function populateDB(tx) {
    //create restaurants table
    tx.executeSql('DROP TABLE IF EXISTS restaurants');
    tx.executeSql('CREATE TABLE IF NOT EXISTS restaurants (res_id integer primary key not null, res_name text not null, type text, price text, service text, cleanliness text, quality text, visited_time text, imageURI text)');
    //insert restaurant
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("Via Spohia", "Grill", "low", "okay", "okay","okay", "6PM 1/2/2020", "img/res1.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("Pinky Cafe", "Sea Food", "average", "good", "good","excellent", "6PM 2/3/2020", "img/res2.png")');
    tx.executeSql('insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("Dorechester", "Grill", "high", "good", "good","excellent", "6PM 3/4/2020", "img/res3.png")');
    //create note table
    tx.executeSql('DROP TABLE IF EXISTS notes');
    tx.executeSql('CREATE TABLE IF NOT EXISTS notes (note_id integer primary key not null,content text not null,user_name text not null, res_id integer not null, foreign key (res_id) references restaurants (res_id) on update cascade on delete cascade)');
    //insert note
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Pham", 1)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Minh", 2)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Huy", 1)')
    tx.executeSql('insert into notes(content, user_name, res_id) values ("Lorem ipsum dolor sit amet", "Linh", 2)')
}
function errorCB(tx, err) {
    alert("Error processing SQL: " + err);
}
function successCB() {

}

function loadAllRestaurants(tx) {
    tx.executeSql('select * from restaurants', [], function (t, rs) {
        let restaurantNum = rs.rows.length;
        let resArray = []

        
        for (let i = 0; i < restaurantNum; i++) {
            let { res_id, res_name, service, quality, cleanliness, imageURI } = rs.rows.item(i);
            let rating = calculateRating({ service: toNumRating(service), cleanliness: toNumRating(cleanliness), quality: toNumRating(quality) })
            resArray.push(rs.rows.item(i))

            
            appendNewRes(res_id, res_name, imageURI)
        }

        
        $("#restaurantList").listview('refresh')

        
        $(".showResDetails").on('click', function (e) {
            let res_id = $(this).attr('res-id')
            
            $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${res_id}` });
        })
    })
}

function toNumRating(stringRating) {
    if (stringRating == "improve") {
        return 1;
    } else if (stringRating == "okay") {
        return 2;
    } else if (stringRating == "good") {
        return 3;
    } else {
        return 4;
    }
}

function calculateRating({ service, cleanliness, quality }) {
    return Math.round((service + cleanliness + quality) / 3);
}
function takePhoto() {
    navigator.camera.getPicture(onCameraSuccess, onCameraError, {
        quality: 50,
        destinationType: Camera.DestinationType.FILE_URI,
        correctOrientation: true
    })
}
function onCameraSuccess(imageURI) {
    var img = document.getElementById('image');
    img.src = imageURI;
}
function onCameraError(message) {
    alert(message);
}
function appendNewNote(note_id, user_name, content) {
    $("#ta-note-list").append(
        `<label for="user1">${user_name}</label>` +
        `<textarea name="user1" id=${note_id} cols="40" rows="5" readonly>${content}</textarea>`
    )
}
function appendNewRes(res_id, res_name, imageURI) {
    $("#restaurantList").append(
        '<li data-theme="c">' +
        `<a class="showResDetails" data-transition="slide" res-id=${res_id}>` +
        `<img src=${imageURI}>` +
        `<h2>${res_name}</h2>` +
        '</a>' +
        '</li>'
    )
}
function deleteRes(res_id) {
    var a_resId = document.querySelector(`a[res-id="${res_id}"]`);
    a_resId.closest('li').remove();
}
function onSubmitNotes(db, user_name, note, res_id, note_id) {
    db.transaction(function (tx) {
        tx.executeSql(`insert into notes(content, user_name, res_id) values ("${note}", "${user_name}", "${res_id}")`)
        appendNewNote(null, user_name, note)
    }, errorCB, successCB)
}

$(document).ready(function () {
    //connect database
    var db = window.openDatabase("Database", "1.0", "Cordova Demo", 2000000);

    //setup database
    db.transaction(populateDB, errorCB, successCB);

    //load all restaurants
    db.transaction(loadAllRestaurants, errorCB, successCB)

    //render restaurant details
    $(document).on('pagebeforeshow', "#resDetails", function (event, data) {
        let param = window.location.href.split("?")[1]
        let res_id = param.replace("resId=", "");
        db.transaction(function (tx) {
            tx.executeSql(`select * from restaurants left join notes on restaurants.res_id = notes.res_id where restaurants.res_id=${res_id}`, [], function (t, rs) {
                let resNum = rs.rows.length
                $("#ta-note-list").empty();
                for (let i = 0; i < resNum; i++) {
                    if (i == 0) {
                        let { price, quality, res_name, service, cleanliness, type, visited_time, imageURI } = rs.rows.item(i)
                        let rating = calculateRating({ service: toNumRating(service), cleanliness: toNumRating(cleanliness), quality: toNumRating(quality) })
                        $("#ta-info-image").attr("src", imageURI)
                        $('.infoResName').text(res_name)
                        $('.infoResType').text(type)
                        $('.infoResPrice').text(`${price}`)
                        $('.infoResRating').text(rating)
                        $('.infoResVisit').text(visited_time)
                        $('#hiddenResId').val(res_id)
                    }
                    let { note_id, content, user_name } = rs.rows.item(i)
                    if (note_id != null) {
                        appendNewNote(note_id, user_name, content)
                    }
                }
            })
        }, errorCB, successCB)
    });

    $("#takepicture").on('click', function () {
        takePhoto();
    })

    $("#ta-noteForm").validate({
        rules:
        {
            user_name: {
                required: true
            },
            note: {
                required: true
            }
        },
        messages: {
            user_name: {
                required: "Required!",
            },
            note: {
                required: "Required!",
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (form) {
            let user_name = $('#ta-noteForm input[name="user_name"]').val();
            let note = $('#ta-noteForm textarea[name="note"]').val();
            let res_id = $("#hiddenResId").val()
            onSubmitNotes(db, user_name, note, res_id)
            $(':input', '#ta-noteForm')
                .not(':button, :submit, :reset, :hidden')
                .val('')
                .prop('checked', false)
                .prop('selected', false);
            $("#ta-noteForm-close").trigger("click");
            return false;
        }
    });

    //validator
    $.validator.addMethod("valueNotEquals", function (value, element, arg) {
        return arg !== value;
    }, "Value must not equal arg!");

    $("#delResBtn").on("click", function () {
        let res_id = $("#hiddenResId").val()
        db.transaction(function (tx) {
            tx.executeSql(`delete from restaurants where restaurants.res_id=${res_id}`)
            tx.executeSql(`delete from notes where notes.res_id=${res_id}`)
            deleteRes(res_id);
        }, errorCB, successCB)
    })

    
    $("#reviewForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            restaurantName: {
                required: true
            },
            visitTime: {
                required: true
            },
            visitDate: {
                required: true
            },
            restaurantPrice: {
                valueNotEquals: "default"
            },
            restaurantType: {
                valueNotEquals: "default"
            },
            restaurantService: {
                valueNotEquals: "default"
            },
            restaurantClean: {
                valueNotEquals: "default"
            },
            foodQuality: {
                valueNotEquals: "default"
            }
        },
        messages: {
            reviewerName: {
                required: "Your name required!",
            },
            restaurantName: {
                required: "Restaurant name required!",
            },
            visitTime: {
                required: "Visit time required!",
            },
            visitDate: {
                required: "Visit date required!",
            },
            restaurantPrice: {
                valueNotEquals: "Price is required!",
            },
            restaurantType: {
                valueNotEquals: "Type is required!"
            },
            restaurantService: {
                valueNotEquals: "Service rating is required!"
            },
            restaurantClean: {
                valueNotEquals: "Service rating is required!"
            },
            foodQuality: {
                valueNotEquals: "Service rating is required!"
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (form) {
            var insertedResId;
            var reviewerName = $('#reviewForm input[name="reviewerName"]').val();
            var restaurantName = $('#reviewForm input[name="restaurantName"]').val();
            var restaurantType = $('#reviewForm select[name="restaurantType"]').val();
            var restaurantService = $('#reviewForm select[name="restaurantService"]').val();
            var restaurantClean = $('#reviewForm select[name="restaurantClean"]').val();
            var foodQuality = $('#reviewForm select[name="foodQuality"]').val();
            var visitTime = $('#reviewForm input[name="visitTime"]').val();
            var visitDate = $('#reviewForm input[name="visitDate"]').val();
            var price = $('#reviewForm select[name="restaurantPrice"]').val();
            var note = $('textarea#rnote').val();
            var imageURI = $("#image").attr('src')

            db.transaction(function (tx) {
                tx.executeSql(`insert into restaurants(res_name, type, price, service, cleanliness, quality, visited_time, imageURI) values ("${restaurantName}", "${restaurantType}", "${price}", "${restaurantService}", "${restaurantClean}","${foodQuality}", "${visitTime + " " + visitDate}", "${imageURI}")`, [], function (tx, rs) {
                    insertedResId = rs.insertId
                })
            }, errorCB, function () {
                db.transaction(function (tx) {
                    //if note exists, save it in the note table
                    if (note != "") {
                        tx.executeSql(`insert into notes(content, user_name, res_id) values ("${note}", "${reviewerName}", ${insertedResId})`)
                    }

                    //append new restaurant in the restaurant list
                    $("#restaurantList").append(
                        '<li data-theme="c">' +
                        `<a class="showResDetails" data-transition="slide" res-id=${insertedResId}>` +
                        `<img src=${imageURI}>` +
                        `<h2>${restaurantName}</h2>` +
                        '</a>' +
                        '</li>'
                    )
                    //refresh the restaurant list
                    $('#restaurantList').listview("refresh")

                    //add event to show detail button 
                    $(".showResDetails").on('click', function (e) {
                        let resId = $(this).attr('res-id')
                        $.mobile.changePage('#resDetails', { dataUrl: `/#resDetails?resId=${resId}` });
                    })

                    //clear all inputs and image
                    $('#reviewForm input[name="reviewerName"]').val("");
                    $('#reviewForm input[name="restaurantName"]').val("");
                    $('#reviewForm input[name="visitTime"]').val("");
                    $('#reviewForm input[name="visitDate"]').val("");
                    $('textarea#rnote').val("");
                    $("#image").attr("src", "img/default-image.png")

                    window.location.href = "#list"
                }, errorCB, successCB)
            })
            return false;
        }
    });

    $("#ta-editForm").validate({
        rules:
        {
            reviewerName: {
                required: true
            },
            restaurantName: {
                required: true
            },
            visitTime: {
                required: true
            },
            visitDate: {
                required: true
            },
            restaurantPrice: {
                valueNotEquals: "default"
            },
            restaurantType: {
                valueNotEquals: "default"
            },
            restaurantService: {
                valueNotEquals: "default"
            },
            restaurantClean: {
                valueNotEquals: "default"
            },
            foodQuality: {
                valueNotEquals: "default"
            }
        },
        messages: {
            reviewerName: {
                required: "Your name required!",
            },
            restaurantName: {
                required: "Restaurant name required!",
            },
            visitTime: {
                required: "Visit time required!",
            },
            visitDate: {
                required: "Visit date required!",
            },
            restaurantPrice: {
                valueNotEquals: "Price is required!",
            },
            restaurantType: {
                valueNotEquals: "Type is required!"
            },
            restaurantService: {
                valueNotEquals: "Service rating is required!"
            },
            restaurantClean: {
                valueNotEquals: "Service rating is required!"
            },
            foodQuality: {
                valueNotEquals: "Service rating is required!"
            }
        },
        errorPlacement: function (err, element) {
            err.insertAfter(element.parent());
        },
        submitHandler: function (form) {
            var rname = $('#ta-editForm input[name="rname"]').val();
            var rtype = $('#ta-editForm select[name="rtype"]').val();
            var rservice = $('#ta-editForm select[name="rservice"]').val();
            var rcleanliness = $('#ta-editForm select[name="rcleanliness"]').val();
            var rquality = $('#ta-editForm select[name="rquality"]').val();
            var time = $('#ta-editForm input[name="time"]').val();
            var date = $('#ta-editForm input[name="date"]').val();
            var rprice = $('#ta-editForm select[name="rprice"]').val();
            var res_id = $('#hiddenResId').val()

            db.transaction(function (tx) {
                tx.executeSql(`update restaurants set res_name="${rname}", type="${rtype}", price="${price}", service="${rservice}", cleanliness="${rcleanliness}", quality="${rquality}", visited_time="${time + " " + date}" where res_id=${res_id}`, [], function (tx, rs) {
                    $(':input', '#ta-editForm')
                        .not(':button, :submit, :reset, :hidden')
                        .val('')
                        .prop('checked', false)
                        .prop('selected', false);
                    $("#ta-editForm-close").trigger("click");

                    $('.infoResName').text(rname)
                    $('.infoResType').text(rtype)
                    $('.infoResPrice').text(`${price}`)
                    $('.infoResRating').text(calculateRating({ service: toNumRating(rservice), cleanliness: toNumRating(rcleanliness), quality: toNumRating(rquality) }))
                    $('.infoResVisit').text(`${time + " " + date}`)

                    $("#restaurantList").empty();
                    db.transaction(loadAllRestaurants, errorCB, successCB)
                })
            }, errorCB, successCB)
            return false;
        }
    });

});


