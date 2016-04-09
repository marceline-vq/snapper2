// general

var DYMO = "Dymo";
var PARALLEL = "parallel";
var SEQUENTIAL = "sequential";
var DYMO_TYPES = [PARALLEL, SEQUENTIAL];
var FEATURE = "Feature";
var PARAMETER = "Parameter";

//navigators

var SEQUENTIAL_NAVIGATOR = "SequentialNavigator";
var SIMILARITY_NAVIGATOR = "SimilarityNavigator";

// parameters

var PLAY = "Play";
var LOOP = "Loop";
var ONSET = "Onset";
var DURATION_RATIO = "DurationRatio";
var AMPLITUDE = "Amplitude";
var PLAYBACK_RATE = "PlaybackRate";
var TIME_STRETCH_RATIO = "TimeStretchRatio";
var PAN = "Pan";
var DISTANCE = "Distance";
var HEIGHT = "Height";
var REVERB = "Reverb";
var FILTER = "Filter";
var PART_INDEX = "PartIndex";
var PART_COUNT = "PartCount";
var PART_ORDER = "PartOrder";
var LISTENER_ORIENTATION = "ListenerOrientation";
var STATS_FREQUENCY = "StatsFrequency";
var BROWNIAN_FREQUENCY = "BrownianFrequency";
var BROWNIAN_MAX_STEP_SIZE = "BrownianMaxStepSize";
var RAMP_TRIGGER = "RampTrigger";
var LEAPING_PROBABILITY = "LeapingProbability";
var CONTINUE_AFTER_LEAPING = "ContinueAfterLeaping";

var PARAMETERS = [PLAY, LOOP, ONSET, DURATION_RATIO, AMPLITUDE, PLAYBACK_RATE, TIME_STRETCH_RATIO, PAN, DISTANCE, HEIGHT, REVERB, FILTER, PART_INDEX, PART_COUNT, PART_ORDER, LISTENER_ORIENTATION, STATS_FREQUENCY];

// features

var LEVEL = "level";
var INDEX = "index";
var ONSET_FEATURE = "onset";
var PITCH_FEATURE = "pitch";
var DURATION_FEATURE = "duration";

// controls

var AUTO_CONTROL = "AutoControl";

var SLIDER = "Slider";
var TOGGLE = "Toggle";
var BUTTON = "Button";
var ACCELEROMETER_X = "AccelerometerX";
var ACCELEROMETER_Y = "AccelerometerY";
var ACCELEROMETER_Z = "AccelerometerZ";
var TILT_X = "TiltX";
var TILT_Y = "TiltY";
var GEOLOCATION_LATITUDE = "GeolocationLatitude";
var GEOLOCATION_LONGITUDE = "GeolocationLongitude";
var GEOLOCATION_DISTANCE = "GeolocationDistance"
var COMPASS_HEADING = "CompassHeading";
var RANDOM = "Random";
var BROWNIAN = "Brownian";
var RAMP = "Ramp";

var CONTROLS = [SLIDER, TOGGLE, ACCELEROMETER_X, ACCELEROMETER_Y, ACCELEROMETER_Z, TILT_X, TILT_Y, GEOLOCATION_LATITUDE, GEOLOCATION_LONGITUDE, GEOLOCATION_DISTANCE, COMPASS_HEADING, RANDOM, BROWNIAN, RAMP];
var UI_CONTROLS = [SLIDER, TOGGLE, BUTTON];