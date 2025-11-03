/**
 * Micro:bit Project: Ocarina of Path
 */
/**
 * A treasure hunt game using the Micro:bit sensors.
 */
/**
 * --- 1. Variables and Initialization ---
 */
/**
 * Game State:
 */
/**
 * 0: Instructions / Start Screen
 */
/**
 * 1: Round 1 (Compass/Steps)
 */
/**
 * 2: Round 2 (LED Hot/Cold)
 */
/**
 * 3: Round 3 (Tone/Metal Detector)
 */
/**
 * 4: Win/Treasure Found
 */
/**
 * 5: Try Again / Fail
 */
function handleRound2 () {
    // Time check (executed every 500ms in the forever loop)
    if (timeRemaining > 0) {
        // Only run this check every 1000ms (1 second)
        if (input.runningTime() % 1000 < 500) {
            timeRemaining += 0 - 1
        }
    } else if (timeRemaining == 0) {
        gameFail()
        // Stop the logic if time is up
        return
    }
    // Distance to target tilt (Absolute difference from target Roll)
    currentRoll = input.rotation(Rotation.Roll)
    distance = Math.abs(currentRoll - targetHeading)
    // LED Brightness Feedback:
    // Closer (smaller distance) = Brighter LED (0-9)
    brightness = Math.map(distance, 0, 90, 9, 0)
    // Clamp brightness between 0 and 9
    brightness = Math.min(9, Math.max(0, brightness))
    // Show a single pixel that gets brighter as they get closer
    // Multiply by 25 to get 0-255 range
    led.plotBrightness(2, 2, brightness * 25)
    // Success Condition: Very close to the target tilt
    if (distance <= 5) {
        // Award 2 pieces, 2 points
        gameSuccess(2, 2)
        startRound3()
    }
}
// ROUND 2: LED Hot/Cold (Medium, 60s)
function startRound2 () {
    gameState = 2
    // 60 seconds time limit
    timeRemaining = 60
    basic.showString("R2: 2 PIECES")
    basic.showString("HUNT: " + timeRemaining + "s")
    // The 'treasure' is a specific roll (tilt) angle
    // Target tilt between flat and vertical
    targetHeading = randint(-90, 90)
}
// Button A for showing current score/status (DEBUGGING/CHECK)
input.onButtonPressed(Button.A, function () {
    basic.showString("P: " + piecesFound)
    basic.showString("S: " + gameScore)
})
function gameSuccess (pieces: number, points: number) {
    piecesFound += pieces
    gameScore += points
    // Visual: Ocarina piece icon
    basic.showLeds(`
        . # # . .
        # . . # .
        # # # # #
        . # # # .
        . . # . .
        `)
    // Sound (Different for each level)
    if (gameState == 1) {
        music.playMelody("C5 B A G F E D C ", 200)
    } else if (gameState == 2) {
        music.playMelody("G B A G C5 B A B ", 200)
    } else if (gameState == 3) {
        music.playMelody("C D E F G A B C5 ", 150)
    }
    basic.showString("FOUND " + pieces + " PIECES!")
}
// --- 4. Utility and Feedback Functions ---
// Convert heading number to a cardinal direction string
function convertHeading (heading: number) {
    if (heading >= 315 || heading < 45) {
        return "NORTH"
    } else if (heading >= 45 && heading < 135) {
        return "EAST"
    } else if (heading >= 135 && heading < 225) {
        return "SOUTH"
    } else {
        return "WEST"
    }
}
// A+B to start the game from the instructions screen, or advance to the next level/reset
input.onButtonPressed(Button.AB, function () {
    if (gameState == 0) {
        // Start Game -> Round 1
        startRound1()
    } else if (gameState == 4 || gameState == 5) {
        // From Win/Lose screen, reset the game
        control.reset()
    }
})
// Must calibrate the compass first
input.onGesture(Gesture.Shake, function () {
    // Only count steps during Round 1
    if (gameState == 1) {
        steps += 1
    }
})
function gameWin () {
    gameState = 4
    basic.showString("YOU FOUND THE OCARINA OF PATH!")
    // Visual: Full Ocarina/Treasure
    basic.showLeds(`
        . # # # .
        # # # # #
        # . # . #
        # # # # #
        . # # # .
        `)
    basic.showString("SCORE: " + gameScore)
    basic.showString("A+B TO RESET")
}
function handleRound3 () {
    // Time check
    if (timeRemaining > 0) {
        // Only run this check every 1000ms (1 second)
        if (input.runningTime() % 1000 < 500) {
            timeRemaining += 0 - 1
        }
    } else if (timeRemaining == 0) {
        gameFail()
        return
    }
    // Distance to target heading
    headingDiff2 = Math.abs(input.compassHeading() - targetHeading)
    // Handle wrap-around (e.g., 350 to 10 degrees is 20, not 340)
    if (headingDiff2 > 180) {
        headingDiff2 = 360 - headingDiff2
    }
    // Tone Feedback:
    // Closer (smaller distance) = Higher Pitch/Frequency
    // High pitch
    maxFreq = 1000
    // Low pitch
    minFreq = 100
    // Map distance (0 to 180) to frequency (maxFreq to minFreq)
    frequency = Math.map(headingDiff2, 0, 180, maxFreq, minFreq)
    // Play the tone in the background
    music.ringTone(frequency)
    // Show a hint icon on the screen
    basic.showIcon(IconNames.Target)
    // Success Condition: Very close to the target heading
    if (headingDiff2 <= 10) {
        // Stop the tone
        music.rest(100)
        // Award 3 pieces, 3 points
        gameSuccess(3, 3)
        gameWin()
    }
}
function handleRound1 () {
    // Show steps taken on screen when Micro:bit is tilted up (Roll close to 0)
    if (input.rotation(Rotation.Roll) < 15 && input.rotation(Rotation.Roll) > -15) {
        basic.showNumber(steps)
    } else {
        basic.clearScreen()
    }
    // Success Condition: 20 steps taken AND facing the target direction
    headingDiff = Math.abs(input.compassHeading() - targetHeading)
    // Success Check (must be within +/- 20 degrees of target)
    if (steps >= 20 && (headingDiff <= 20 || headingDiff >= 340)) {
        // Award 1 piece, 1 point
        gameSuccess(1, 1)
        startRound2()
    } else if (steps >= 20) {
        // Give new clue if they walked 20 steps but in the wrong direction
        basic.showString("Wrong Way! Find " + convertHeading(targetHeading))
        // Reset steps
        steps = 0
    }
}
function gameFail () {
    // Stop the music just in case Round 3 was active
    music.rest(100)
    gameState = 5
    // Visual
    basic.showIcon(IconNames.No)
    // Message
    basic.showString("TRY AGAIN?")
    // Sound
    // Annoying sound
    music.playMelody("C C C C C C C C ", 50)
    basic.pause(2000)
    basic.showString("A+B TO RESET")
}
// ROUND 3: Tone Metal Detector (Hard, 90s)
function startRound3 () {
    gameState = 3
    // 90 seconds time limit
    timeRemaining = 90
    basic.showString("R3: 3 PIECES")
    basic.showString("HUNT: " + timeRemaining + "s")
    // The 'treasure' is a specific compass heading
    targetHeading = randint(0, 359)
}
// --- 3. Round Functions ---
// ROUND 1: Compass & Steps (Easy)
function startRound1 () {
    gameState = 1
    steps = 0
    basic.showString("R1: 1 PIECE")
    // Pick a random cardinal direction (0=N, 90=E, 180=S, 270=W)
    directions = [
    0,
    90,
    180,
    270
    ]
    targetHeading = directions[randint(0, directions.length - 1)]
    basic.showString("GO: " + convertHeading(targetHeading))
}
let directions: number[] = []
let headingDiff = 0
let frequency = 0
let minFreq = 0
let maxFreq = 0
let headingDiff2 = 0
let steps = 0
let brightness = 0
let targetHeading = 0
let distance = 0
let currentRoll = 0
let timeRemaining = 0
let gameScore = 0
let piecesFound = 0
let gameState = 0
// --- START CODE (Runs once on power-up) ---
// Calibrate the compass - this will prompt the user to tilt the micro:bit in a circle
input.calibrateCompass()
// Show the title and instructions
basic.showString("OCARINA OF PATH")
basic.showLeds(`
    . # # # .
    # . . . #
    # . # . #
    # . . . #
    . # # # .
    `)
basic.pause(1000)
basic.showString("A+B TO START")
// Initialize variables
gameState = 0
piecesFound = 0
gameScore = 0
// --- 5. Main Game Loop ---
// This loop runs the active round's logic
basic.forever(function () {
    if (gameState == 1) {
        handleRound1()
    } else if (gameState == 2) {
        handleRound2()
    } else if (gameState == 3) {
        handleRound3()
    } else {
        // Clear screen when not in an active round (e.g., instructions or win/lose screen)
        basic.clearScreen()
    }
    // Pause briefly to control execution speed (and for the time check)
    basic.pause(500)
})
