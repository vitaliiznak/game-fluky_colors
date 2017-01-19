'use strict'

setOneTouchAtAtime()

let score = 0;


const turnHistory = [];

const dimensions = [6, 6], //there is a bug
    colorsNum = 5,
    squareColorClasses = ['green', 'red', 'yellow', 'blue', 'purple', 'brown', 'orange'],
    squareColorClassesString = squareColorClasses.slice(0, colorsNum).join(' '),
    colorsAvailableAll = Array.from({ length: colorsNum }, (v, k) => k);

const MAX_VIEWPORT_WIDTH = 800,
    width = window.innerWidth < MAX_VIEWPORT_WIDTH ? window.innerWidth - 20 : MAX_VIEWPORT_WIDTH - 20;

const playgroundMaxWidth = parseInt($('#viewWrapper').css('max-width'));

const $squareTmpl = $('#squareTmpl').find('.square_wrapper'),
    $playGround = $('[data-id="playGround"]').css({
        width: width,
        height: width * (dimensions[0] / dimensions[1]),
        'max-width': playgroundMaxWidth,
        'max-height': playgroundMaxWidth * (dimensions[0] / dimensions[1])
    })
const containerDimensions = [$playGround.height(), $playGround.width()]
$('.scoreView').css('width', width);


const ColorMap = colorTree(colorsAvailableAll);
const WorldMap = drawWorld(ColorMap, $playGround);;


//almost LISP :)
/* detect continuous color chain */
function continuous(world, pos, query) {
    //can be refactored to be a one function
    const mem = [];

    function continuousAux(world, pos, query /*, mem = {}*/ ) {
        const queryAux = Object.assign({
            color: world[pos],
            directionsStr: ['-1,0', '1,0', '0,-1', '0,1'],
        }, query);

        if (world[pos] === undefined ||
            queryAux.color === undefined ||
            mem[pos] !== undefined ||
            world[pos] !== queryAux.color)
            return mem;
        else {
            mem[pos] = pos.toString();

            return $.extend({},
                (queryAux.directionsStr.includes('-1,0') ? continuousAux(world, [pos[0] - 1, pos[1]], Object.assign({}, queryAux)) : {}),
                (queryAux.directionsStr.includes('1,0') ? continuousAux(world, [pos[0] + 1, pos[1]], Object.assign({}, queryAux)) : {}),
                (queryAux.directionsStr.includes('0,-1') ? continuousAux(world, [pos[0], pos[1] - 1], Object.assign({}, queryAux)) : {}),
                (queryAux.directionsStr.includes('0,1') ? continuousAux(world, [pos[0], pos[1] + 1], Object.assign({}, queryAux)) : {})
            );
        }
    }
    return Object.values(continuousAux(world, pos, query));
}

function nextCell(world) {
    if (Math.round(Math.random())) {
        for (let rowInt = 0; rowInt < dimensions[0]; rowInt++) {
            for (let columnInt = 0; columnInt < dimensions[1]; columnInt++) {
                let key = [rowInt, columnInt].toString();

                if (world[key] === null) return arrayIntFromString(key);
            }
        }
    } else {
        for (let columnInt = 0; columnInt < dimensions[1]; columnInt++) {
            for (let rowInt = 0; rowInt < dimensions[0]; rowInt++) {
                let key = [rowInt, columnInt].toString();

                if (world[key] === null) return arrayIntFromString(key);
            }
        }
    }
    return null;
}

//can be refactored
function colorTree(colors) {
    let toReturn;
    let i = 0;
    do {
        let startTime = Date.now();
        let node = {
            pos: [0, 0],
            parrent: null,
            world: {},
            children: {}
        }
        for (let rowInt = 0; rowInt < dimensions[0]; rowInt++) {
            for (let columnInt = 0; columnInt < dimensions[1]; columnInt++) {
                node.world[[rowInt, columnInt].toString()] = null;
            }
        }
        node.world[[0, 0]] = getRandomInt(0, colors.length); //set color

        let newPos = nextCell(node.world);
        let newWorld = $.extend(true, {}, node.world);
        let colorsAvailable = colors.filter(el => !Object.keys(node.children).includes(el));

        newWorld[newPos] = colorsAvailable[getRandomInt(0, colorsAvailable.length)];
        node.children[newWorld[newPos]] = {
            pos: newPos,
            parrent: node,
            world: newWorld,
            children: {}
        }
        try {
            toReturn = (function colorTreeAux(node, colors) {
                if (Date.now() - startTime > 1000) throw "too long";

                const colorsAvailable = colors.filter(el => !Object.keys(node.children).includes(el));
                if (!colorsAvailable.length) return colorTreeAux(node.parrent, colors);
                if (continuous(node.world, node.pos).length > 2) return colorTreeAux(node.parrent, colors); //back
                const newPos = nextCell(node.world);
                if (!newPos) return node.world;

                const newWorld = $.extend(true, {}, node.world);
                newWorld[newPos] = colorsAvailable[getRandomInt(0, colorsAvailable.length)];
                return colorTreeAux(
                    node.children[newWorld[newPos]] = {
                        pos: newPos,
                        parrent: node,
                        world: newWorld,
                        children: {}
                    },
                    colors);

            }(node.children[newWorld[newPos]], colors));
        } catch (err) { console.log(err); }
        i++;
    }
    while (!toReturn && i < 20);
    return toReturn; //problem if it is not quadrat

};


function drawWorld(colorMap, $playGround) {
    const worldMap = {};
    const cellsNum = dimensions[0] * dimensions[1];
    for (let rowInt = 0; rowInt < dimensions[0]; rowInt++) {
        for (let columnInt = 0; columnInt < dimensions[1]; columnInt++) {
            worldMap[[rowInt, columnInt]] = {
                active: true,
                $square: $squareTmpl.clone().css({
                        'top': rowInt * containerDimensions[0] / dimensions[0] + 'px',
                        'left': columnInt * containerDimensions[1] / dimensions[1] + 'px',
                        width: containerDimensions[1] / dimensions[1] + 'px',
                        height: containerDimensions[0] / dimensions[0] + 'px'
                    })
                    .addClass(squareColorClasses[colorMap[[rowInt, columnInt]]])
                    .attr('data-pos', [rowInt, columnInt].toString())
                    .appendTo($playGround)
            }
        }
    }
    return worldMap;
}

const squareSize = [$('.square').width(), $('.square').height()];

let timestamp = 0;
let posOfClick = undefined;
let posSquareOfClick = undefined;

$playGround
    .on('mousedown touchstart', '.square_wrapper', playgroundOnMouseDownListener)
    .on('mouseup touchend', '.square_wrapper', playgroundOnCLickListener)
    .on('mousedown touchstart', '.square_wrapper', playgroundOnMouseDownListener);

	

//optimize this
const mouseMoveThrottle = throttle((ev) => {
        let clientX;
        let clientY;
        if (ev.changedTouches && ev.changedTouches.length) {
            clientX = ev.changedTouches[0].clientX;
            clientY = ev.changedTouches[0].clientY;
        } else {
            clientX = ev.clientX;
            clientY = ev.clientY;
        }
        const xDifAbs = Math.abs(posOfClick[0] - clientX);
        const yDifAbs = Math.abs(posOfClick[1] - clientY);

        if (xDifAbs < squareSize[0] * 1.4 && yDifAbs < squareSize[1] * 1.4) return;

        //need to chache it somehow
        const contin = (xDifAbs < yDifAbs) ?
            //vertical
            continuous(ColorMap, posSquareOfClick, { directionsStr: ['1,0', '-1,0'] }) :
            //horizontal
            continuous(ColorMap, posSquareOfClick, { directionsStr: ['0,1', '0,-1'] });
        if (contin.length < 3) return;

        $playGround
            .off('mouseup touchend', '.square_wrapper', playgroundOnCLickListener)
            .off('mousedown touchstart', '.square_wrapper', playgroundOnMouseDownListener);
        contin.forEach((el) => WorldMap[el].$square.css({ opacity: 0.2 }));
        erase(contin).then((ev) => {
            $playGround.on('mouseup touchend', '.square_wrapper', playgroundOnCLickListener);
            $playGround.on('mousedown touchstart', '.square_wrapper', playgroundOnMouseDownListener);
        });

    },
    100);

const cancelErase = () => $playGround.off('mousemove touchmove', mouseMoveThrottle);
$(document)
    .on('mouseup touchend', cancelErase)
    .on('mouseleave touchleave', cancelErase);
$(document.body)
    .on('mouseup touchend', cancelErase)
    .on('mouseleave touchleave', cancelErase);


function playgroundOnCLickListener(ev) {
    let clientX;
    let clientY;
    if (ev.changedTouches && ev.changedTouches.length) {
        clientX = ev.changedTouches[0].clientX;
        clientY = ev.changedTouches[0].clientY;
    } else {
        clientX = ev.clientX;
        clientY = ev.clientY;
    }

    if ((new Date().getTime() - timestamp) > 400 ||
        Math.abs(clientX - posOfClick[0]) > squareSize[0] / 1.4 ||
        Math.abs(clientY - posOfClick[1]) > squareSize[1] / 1.4) return false;

    ;


    $playGround
        .off('mouseup touchend', '.square_wrapper', playgroundOnCLickListener)
        .off('mousedown touchstart', '.square_wrapper', playgroundOnMouseDownListener);
    return changeColor(arrayIntFromString(ev.currentTarget.dataset.pos)).then(() => {
        //is game over
        if (!checkAllowed()) {
            //not allowed

            //show score view
            alert('you loose');
        };

    }).then((ev) => {
        $playGround.on('mouseup touchend', '.square_wrapper', playgroundOnCLickListener)
            .on('mousedown touchstart', '.square_wrapper', playgroundOnMouseDownListener);
    });

}




function playgroundOnMouseDownListener(ev) {
    ev.preventDefault();
    if (ev.which != 0 && ev.which !== 1) return false;

    timestamp = new Date().getTime();
    const squareCoords = getCoordsOfElement($(ev.currentTarget).find('.square'));

    posOfClick = squareCoords.center;
    posSquareOfClick = arrayIntFromString(this.dataset.pos);

    $playGround
        .off('mousemove touchmove', mouseMoveThrottle)
        .on('mousemove touchmove', mouseMoveThrottle);
}


function getCoordsOfElement($el) {
    const offset = $el.offset();
    return {
        offsetLeft: offset.left,
        offsetRight: offset.left + $el.width(),
        offsetTop: offset.top,
        offsetBottom: offset.top + $el.height(),
        center: [offset.left + $el.width() / 2, offset.top + $el.height() / 2]
    }
}


function changeColor(pos) {

    //model
    if (!WorldMap[pos] || !WorldMap[pos].active) return Promise.resolve(null); //f not cross
    WorldMap[pos].active = false;

    const colorsAvailable = colorsAvailableAll
        .filter(el => el !== ColorMap[pos]);

    ColorMap[pos] = colorsAvailable[getRandomInt(0, colorsAvailable.length)];

    //view
    WorldMap[pos].$square
        .removeClass(squareColorClassesString)
        .addClass(squareColorClasses[ColorMap[pos]])
        .find('svg').show();
    return Promise.resolve(ColorMap[pos]);
}

function erase(contin) {
    return Promise.all(
            contin.map((pos) => {
                ColorMap[pos] = null;
                return new Promise((resolve, reject) =>
                    WorldMap[pos].$square.velocity({
                        opacity: 0
                    }, 220, "linear", () => resolve(pos)))
            }))
        .then(dropWorld)
        .then(updateScore)
        .then(addNew);
}


const $scoreTxt = $('[data-id="scoreTxt"]');

function updateScore(positions) {
    score = score + positions.length;
    $scoreTxt.text(score);
    return positions;
}

const realDimnSquareDimnVertCoef = containerDimensions[0] / dimensions[0];

function dropWorld(positions) {
    //fall world
    const promices = [];
    for (let row = dimensions[0] - 1; row >= 0; row--) {
        for (let col = dimensions[1] - 1; col >= 0; col--) {
            if (ColorMap[[row, col]] === null) continue;
            let rowNext = row;
            while (ColorMap[[rowNext + 1, col]] === null) rowNext++;
            if (rowNext === row) continue;
            promices.push(new Promise(function(resolve, reject) {
                //model
                [ColorMap[[rowNext, col]], ColorMap[[row, col]]] = [ColorMap[[row, col]], ColorMap[[rowNext, col]]]; //swap
                [WorldMap[[rowNext, col]], WorldMap[[row, col]]] = [WorldMap[[row, col]], WorldMap[[rowNext, col]]]; //swap

                //view
                WorldMap[[rowNext, col].toString()].$square
                    .attr('data-pos', [rowNext, col].toString())
                    .velocity({
                        'top': rowNext * realDimnSquareDimnVertCoef + 'px'
                    }, 200, "linear", resolve);
            }));
        }
    }
    return Promise.all(promices);
}

function addNew(positions) {
    const promises = [];
   

    for (let row = dimensions[0] - 1; row >= 0; row--) {
        for (let col = dimensions[1] - 1; col >= 0; col--) {
            let {distribution,  distributionArr, coloredSum} = getColorsInfo();
            let pos = [row, col].toString();
            if (ColorMap[pos] !== null) continue;

            let inverseDistrubArr = [];
            let inverseSum = 0;
            for(let i= 0;i < distributionArr.length ; i++ ){
                let inverse = coloredSum - distributionArr[i];
                inverseDistrubArr[i] = inverse;
                inverseSum = inverseSum + inverse
            }
            
            const probabilitySpec =  inverseDistrubArr.map( (v, k) => ({ value: k, prob:  v / inverseSum }));
            
            ColorMap[pos] = weightedRandSum(probabilitySpec);
            WorldMap[pos].active= true;
            //by some custom color destribution

            //game view
            promises.push(
                new Promise(function(resolve, reject) {
                    WorldMap[pos].$square
                        .attr('data-pos', pos)
                        .removeClass(squareColorClassesString)
                        .addClass(squareColorClasses[ColorMap[pos]])
                        .css({
                            'top': row * realDimnSquareDimnVertCoef + 'px'
                        })
                        .velocity({
                            'opacity': 1
                        }, 80, "swing", resolve)
                        .find('svg').hide();
                }));
        }
    }
    return Promise.all(promises);
}

function checkAllowed() {
    for (let key in WorldMap) {
        if (WorldMap[key].active) return true;
    }
    return false;
}


function getColorsInfo() {
    const distribution = {};
    const distributionArr = Array.from({ length: colorsNum }, (v, k) => 0);
    let coloredSum = 0
    for (let rowInt = 0; rowInt < dimensions[0]; rowInt++) {
        for (let columnInt = 0; columnInt < dimensions[1]; columnInt++) {
            //one time all
            let color = ColorMap[[rowInt, columnInt]];
            distribution[color] = distribution[color] ? distribution[color] + 1 : 1;
            if (color !== null) {
                coloredSum++;
                distributionArr[color]++;
            }

        }
    }
    return { distribution, distributionArr, coloredSum };
}



/*****************/
//  TUTORIAL
/****************/
$('[data-id="helpBtn"]').on('click', help);
$('[data-id="resumeBtn"]').on('click', resume);;

function resume() {
    window.location.reload();
}
$('[data-id="helpCloseBtn"]').on('click', function() {
    $('[data-id="tutorial"]').hide();
});

function help() {
    $('[data-id="tutorial"]').show();
}
