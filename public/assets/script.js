var socket = io.connect();

// Clear drawings, for "onclick".
function clearDrawings() {
    socket.emit("clear_it", true);
}

// Current color and stroker.
var current = {
    color: "#313131", // Default stroker color.
    stroker: 4 // Default stroker size.
};

function removeTextStuff() {
    // Remove shit that has to do with text.
    $("textarea#textareaTest").remove();
    $("#saveText").remove();
    $("#textAreaPopUp").remove();
}

function saveTextFromArea(y, x){
    // Get the value of the text area, then destroy it and the save button.
    var text = $("textarea#textareaTest").val();
    removeTextStuff(); // Remove shit that has to do with text.

    // Get the canvas and add the text functions.
    var canvas = document.getElementById("drawing");
    var ctx = canvas.getContext("2d");
    var cw = canvas.clientWidth;
    var ch = canvas.clientHeight;

    // Break the text into arrays based on a text width of 100px.
    var phraseArray = getLines(ctx,text,100);

    // Add the text functions to the ctx.
    CanvasTextFunctions.enable(ctx);
    var counter = 0;

    // Stuff to be sent to the server, and stored in "text_history".
    var font = "Times New Roman";
    var fontsize = 24;

    // Draw each phrase to the screen, making the top position 20px more each time so it appears there are line breaks.
    $.each(phraseArray, function() {
        // Set the placement in the canvas.
        var lineheight = fontsize * 1.5;
        var newline = ++counter;
        newline = newline * lineheight;
        var topPlacement = y - $("#drawing").position().top + newline;
        var leftPlacement = x - $("#drawing").position().left;

        text = this;

        // Divded by width and height to make it fit all screens.
        socket.emit("draw_text", {text: [font, fontsize, leftPlacement / canvas.width, topPlacement / canvas.height, text, current.color]});
    });
}

function getLines(ctx, phrase, maxPxLength) {
    // Break the text area text into lines based on "box" width.
    var wa = phrase.split(" "),
        phraseArray = [],
        lastPhrase = "",
        l = maxPxLength,
        measure = 0;

    ctx.font = "24px Times New Roman";

    for (var i = 0; i < wa.length; i++) {
        var w = wa[i];
        measure = ctx.measureText(lastPhrase+w).width;

        if (measure < l) {
            lastPhrase += (" " + w);
        } else {
            phraseArray.push(lastPhrase);
            lastPhrase = w;
        }

        if (i === wa.length -1 ) {
            phraseArray.push(lastPhrase);
            break;
        }
    }

    return phraseArray;
}

document.addEventListener("DOMContentLoaded", function() {
    /* TEXT STUFF. */
    // Enable text typing.
    $(".texter").on("click", function() {
        $("#drawing").mousedown(function(e) {
            mouse.click = false; // Prevent user from drawing.

            if ($("#textAreaPopUp").length == 0) {
                var mouseX = e.pageX - this.offsetLeft + $("#drawing").position().left;
                var mouseY = e.pageY - this.offsetTop;

                // Append a text area box to the canvas where the user clicked to enter text.
                var textArea = "<div id='textAreaPopUp' style='position:absolute;top:" + mouseY + "px;left:" + mouseX + "px;z-index:30;'><textarea id='textareaTest' style='width:100px;height:50px;'></textarea>";
                var saveButton = "<input type='button' value='Spara' id='saveText' onclick='saveTextFromArea(" + mouseY + "," + mouseX + ");'></div>";
                var appendString = textArea + saveButton;
                $("#main").append(appendString);
            } else {
                removeTextStuff(); // Remove text shit.
                var mouseX = e.pageX - this.offsetLeft + $("#drawing").position().left;
                var mouseY = e.pageY - this.offsetTop;
                // Append a text area box to the canvas where the user clicked to enter text.
                var textArea = "<div id='textAreaPopUp' style='position:absolute;top:" + mouseY + "px;left:" + mouseX + "px;z-index:30;'><textarea id='textareaTest' style='width:100px;height:50px;'></textarea>";
                var saveButton = "<input type='button' value='Spara' id='saveText' onclick='saveTextFromArea(" + mouseY + "," + mouseX + ");'></div>";
                var appendString = textArea + saveButton;
                $("#main").append(appendString);
            }
        });
    });

    /* DRAWING STUFF. */
    $(".drawer").on("click", function() {
        $("#drawing").mousedown(function() {
            removeTextStuff(); // Remove shit that has to do with text.
            mouse.click = true; // Enable user to draw.
        });
    });

    var colors = document.getElementsByClassName("clr");
    var strokerSizes = document.getElementsByClassName("stroker");

    // Detect color click.
    for (var i = 0; i < colors.length; i++) {
        colors[i].addEventListener("click", onColorUpdate, false);
    };

    // Detect stroker click.
    for (var i = 0; i < strokerSizes.length; i++) {
        strokerSizes[i].addEventListener("click", onStrokerUpdate, false);
    };

    var mouse = { 
        click: false,
        move: false,
        pos: {x:0, y:0},
        pos_prev: false
    };

    // Get canvas element and create context.
    var canvas  = document.getElementById("drawing");
    var context = canvas.getContext("2d");
    var width = window.innerWidth;
    var height = window.innerHeight;

    // Set canvas to full browser width/height.
    canvas.width = width;
    canvas.height = height;

    // Register mouse event handlers.
    canvas.onmousedown = function(e) {mouse.click = true;};
    canvas.onmouseup = function(e) {mouse.click = false;};

    canvas.onmousemove = function(e) {
        // Normalize mouse position to range 0.0 - 1.0.
        mouse.pos.x = e.clientX / width;
        mouse.pos.y = e.clientY / height;
        mouse.move = true;
    };

    // Draw line(s) received from the server.
    socket.on("draw_line", function(data) {
        var line = data.line; // Line from the server, including line, color and stroker.
        context.beginPath();
        context.moveTo(line[0].x * width, line[0].y * height);
        context.lineTo(line[1].x * width, line[1].y * height);
        context.lineJoin = "round"; // Round drawing style.
        context.lineCap = "round"; // Round drawing style.
        context.strokeStyle = line[2]; // Old drawings' colors.
        context.lineWidth = line[3]; // Old strokers' widths.
        context.stroke();
    });

    socket.on("draw_text", function(data) {
        var textFromServer = data.text;
        var fontAndFontSize = textFromServer[1] + "px " + textFromServer[0];
        var posLeft = textFromServer[2];
        var posTop = textFromServer[3];
        var theText = textFromServer[4];
        var textColor = textFromServer[5];

        context.fillStyle = textColor;
        context.font = fontAndFontSize;
        context.fillText(theText, posLeft * width, posTop * height);
    });

    socket.on("clear_it", function(){
        context.clearRect(0, 0, width, height);
        // console.log("Client cleared drawings.");
    });

    function onColorUpdate(e){
        var wantedColor = e.target.className.split(" ")[1];

        if (wantedColor === "black") {
            current.color = "#313131";
            // console.log("Black chosen.");
        } else if (wantedColor === "red") {
            current.color = "#eb3131";
            // console.log("Red chosen.");
        } else if (wantedColor === "green") {
            current.color = "#46b13b";
            // console.log("Green chosen.");
        } else if (wantedColor === "blue") {
            current.color = "#308db8";
            // console.log("Blue chosen.");
        } else if (wantedColor === "yellow") {
            current.color = "#f6da1e";
            // console.log("Yellow chosen.");
        } else if (wantedColor === "eraser") {
            current.color = "#fff";
            // console.log("Eraser chosen.");
        }
    }

    function onStrokerUpdate(e){
        var wantedStroker = e.target.className.split(' ')[1];

        if (wantedStroker === "small") {
            current.stroker = 3;
            // console.log("Small stroker chosen.");
        } else if (wantedStroker === "medium") {
            current.stroker = 6;
            // console.log("Medium stroker chosen.");
        } else if (wantedStroker === "large") {
            current.stroker = 12;
            // console.log("Large stroker chosen.");
        }
    }

    // Main loop, running every 25ms.
    function mainLoop() {
        // Check if the user is drawing.
        if (mouse.click && mouse.move && mouse.pos_prev) {
            // Send line to the server.
            socket.emit("draw_line", {line: [mouse.pos, mouse.pos_prev, current.color, current.stroker]});
            mouse.move = false;
        }

        mouse.pos_prev = {x: mouse.pos.x, y: mouse.pos.y};
        setTimeout(mainLoop, 25);
    }

    mainLoop();
});

$(document).ready(function() {
    $(".black").click(); // "Click" black color button as default.
    $(".black").addClass("selected-element"); // Add selected class to black button as default.
    $(".small").click(); // "Click" small stroker button as default.
    $(".small").addClass("selected-element"); // Add selected class to small stroker as default.

    /* Handle clicks on buttons. Give them a border to show which one is selected. Hard coded cause' YOLO! */
    $(".black").on("click", function() {
        $(".black").addClass("selected-element");

        // Remove.
        $(".red").removeClass("selected-element");
        $(".green").removeClass("selected-element");
        $(".blue").removeClass("selected-element");
        $(".yellow").removeClass("selected-element");
        $(".eraser").removeClass("selected-element");
    });

    $(".red").on("click", function() {
        $(".red").addClass("selected-element");

        // Remove.
        $(".black").removeClass("selected-element");
        $(".green").removeClass("selected-element");
        $(".blue").removeClass("selected-element");
        $(".yellow").removeClass("selected-element");
        $(".eraser").removeClass("selected-element");
    });

    $(".green").on("click", function() {
        $(".green").addClass("selected-element");

        // Remove.
        $(".black").removeClass("selected-element");
        $(".red").removeClass("selected-element");
        $(".blue").removeClass("selected-element");
        $(".yellow").removeClass("selected-element");
        $(".eraser").removeClass("selected-element");
    });

    $(".blue").on("click", function() {
        $(".blue").addClass("selected-element");

        // Remove.
        $(".black").removeClass("selected-element");
        $(".red").removeClass("selected-element");
        $(".green").removeClass("selected-element");
        $(".yellow").removeClass("selected-element");
        $(".eraser").removeClass("selected-element");
    });

    $(".yellow").on("click", function() {
        $(".yellow").addClass("selected-element");

        // Remove.
        $(".black").removeClass("selected-element");
        $(".red").removeClass("selected-element");
        $(".green").removeClass("selected-element");
        $(".blue").removeClass("selected-element");
        $(".eraser").removeClass("selected-element");
    });

    $(".eraser").on("click", function() {
        $(".eraser").addClass("selected-element");

        // Remove.
        $(".black").removeClass("selected-element");
        $(".red").removeClass("selected-element");
        $(".green").removeClass("selected-element");
        $(".blue").removeClass("selected-element");
        $(".yellow").removeClass("selected-element");
        $(".texter").removeClass("selected-element");
        $("body").removeClass("text-cursor");

        if (current.stroker == 3) {
            $(".small").addClass("selected-element");
        } else if (current.stroker == 6) {
            $(".medium").addClass("selected-element");
        } else if (current.stroker == 12) {
            $(".large").addClass("selected-element");
        }

        removeTextStuff();
    });

    $(".small").on("click", function() {
        $(".small").addClass("selected-element");

        // Remove.
        $(".medium").removeClass("selected-element");
        $(".large").removeClass("selected-element");
        $(".texter").removeClass("selected-element");
        $("body").removeClass("text-cursor");

        if (current.color == "#fff") {
            $(".eraser").addClass("selected-element");
        }

        removeTextStuff();
    });

    $(".medium").on("click", function() {
        $(".medium").addClass("selected-element");

        // Remove.
        $(".small").removeClass("selected-element");
        $(".large").removeClass("selected-element");
        $(".texter").removeClass("selected-element");
        $("body").removeClass("text-cursor");

        if (current.color == "#fff") {
            $(".eraser").addClass("selected-element");
        }

        removeTextStuff();
    });

    $(".large").on("click", function() {
        $(".large").addClass("selected-element");

        // Remove.
        $(".small").removeClass("selected-element");
        $(".medium").removeClass("selected-element");
        $(".texter").removeClass("selected-element");
        $("body").removeClass("text-cursor");

        if (current.color == "#fff") {
            $(".eraser").addClass("selected-element");
        }

        removeTextStuff();
    });

    $(".texter").on("click", function() {
        $(".texter").addClass("selected-element");
        $("body").addClass("text-cursor");

        // Remove.
        $(".small").removeClass("selected-element");
        $(".medium").removeClass("selected-element");
        $(".large").removeClass("selected-element");
        $(".eraser").removeClass("selected-element");

        if (current.color == "#fff") {
            $(".black").click();
            $(".black").addClass("selected-element");
        }

        removeTextStuff();
    });

    $(".trash").on("click", function() {
        if ($(".texter").hasClass("selected-element")) {
            $(".texter").click(); // "Click" black color button as default.  
        }
    });
});
