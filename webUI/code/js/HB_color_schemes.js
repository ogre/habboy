
    var HB_COLOR_SCHEME;
    var HB_COLOR_SCHEMES = {};

HB_COLOR_SCHEMES["DEFAULT"] = {
    HABDEC: {
        CSS: {
            HD_bg: 	            "hsl(210, 15%,  15%)",
            HD_fg: 	            "hsl(210, 15%,  25%)",
            HD_button: 	        "hsl(210, 15%,  25%)",
            HD_button_border:   "hsl(210, 15%,  15%)",
            HD_button_text: 	"hsl(0,   0%,   55%)",
            HD_label:      	    "hsl(32,  93%,  45%)",
            HD_highlight:    	"hsl(210, 80%,  45%)",
            HD_enabled:    	    "hsl(50, 100%, 40%)",
            HD_sentence:     	"hsl(0,   100%, 33%)"
        },
        SPECTRUM: {
            HIGH: "hsl(30, 30%, 100%)",
            MID: "hsl(30, 80%, 75%)",
            LOW: "hsl(30, 100%, 30%)",
            FILTER: "hsla(200, 50%, 30%, .5)"
        }
    },
    HABBOY: {
        CSS: {
            HB_bg:                          'hsl(210, 15%, 14%)',
            HB_text:                        '#eee',
            HB_text_highlight:              'hsl(32, 93%, 45%)',
            HB_tab_button:                  'rgb(31, 62, 93)',
            HB_tab_button_active:           '#bb0',
            HB_tab_button_text:             '#eee',
            HB_tab_button_active_text:      '#000',
            HB_tab_button_border:           'rgb(31, 62, 93)',
            HB_tab_button_border_highlight: '#b80',
            HB_button:                      'rgb(31, 62, 93)',
            HB_button_active:               '#990',
            HB_button_text:                 '#ccc',
            HB_button_active_text:          '#000',
            HB_button_border:               '#000'
        }
    }
};


HB_COLOR_SCHEMES["RED"] = {
    HABDEC: {
        CSS: {
            HD_bg: 	            "hsl(0, 0%,   0%)",
            HD_fg: 	            "hsl(0, 50%,  10%)",
            HD_button: 	        "hsl(0, 100%, 5%)",
            HD_button_border:   "hsl(0, 100%, 20%)",
            HD_button_text: 	"hsl(0, 100%, 60%)",
            HD_label:      	    "hsl(0, 100%, 45%)",
            HD_highlight:    	"hsl(0, 80%,  45%)",
            HD_enabled:    	    "hsl(0, 100%, 30%)",
            HD_sentence:     	"hsl(0, 100%, 33%)"
        },
        SPECTRUM: {
            HIGH: "hsl(0, 30%, 100%)",
            MID: "hsl(0, 80%, 55%)",
            LOW: "hsl(0, 100%, 10%)",
            FILTER: "hsla(0, 50%, 30%, .5)"
        }
    },
    HABBOY: {
        CSS: {
            HB_bg:                          "hsl(0, 0%,   0%)",
            HB_text:                        "hsl(0, 100%, 60%)",
            HB_text_highlight:              "hsl(0, 80%,  45%)",
            HB_tab_button:                  "hsl(0, 100%, 5%)",
            HB_tab_button_active:           "hsl(0, 100%, 25%)",
            HB_tab_button_text:             "hsl(0, 100%, 60%)",
            HB_tab_button_active_text:      "hsl(0, 100%, 80%)",
            HB_tab_button_border:           "hsl(0, 100%, 40%)",
            HB_tab_button_border_highlight: "hsl(0, 60%,  0%)",
            HB_button:                      "hsl(0, 20%,  5%)",
            HB_button_active:               "hsl(0, 100%, 25%)",
            HB_button_text:                 "hsl(0, 100%, 60%)",
            HB_button_active_text:          "hsl(0, 100%, 80%)",
            HB_button_border:               "hsl(0, 100%, 30%)",
        }
    }
};

HB_COLOR_SCHEMES["GREEN"] = {
    HABDEC: {
        CSS: {
            HD_bg: 	            "hsl(120, 0%,   0%)",
            HD_fg: 	            "hsl(120, 50%,  10%)",
            HD_button: 	        "hsl(120, 100%, 2%)",
            HD_button_border:   "hsl(120, 100%, 15%)",
            HD_button_text: 	"hsl(120, 100%, 30%)",
            HD_label:      	    "hsl(120, 100%, 30%)",
            HD_highlight:    	"hsl(120, 80%,  35%)",
            HD_enabled:    	    "hsl(120, 100%, 20%)",
            HD_sentence:     	"hsl(120, 100%, 33%)"
        },
        SPECTRUM: {
            HIGH: "hsl(120, 30%, 100%)",
            MID: "hsl(120, 80%, 55%)",
            LOW: "hsl(120, 100%, 10%)",
            FILTER: "hsla(120, 50%, 30%, .5)"
        }
    },
    HABBOY: {
        CSS: {
            HB_bg:                          "hsl(120, 0%,   0%)",
            HB_text:                        "hsl(120, 100%, 60%)",
            HB_text_highlight:              "hsl(120, 80%,  45%)",
            HB_tab_button:                  "hsl(120, 100%, 5%)",
            HB_tab_button_active:           "hsl(120, 100%, 20%)",
            HB_tab_button_text:             "hsl(120, 100%, 60%)",
            HB_tab_button_active_text:      "hsl(120, 100%, 70%)",
            HB_tab_button_border:           "hsl(120, 100%, 40%)",
            HB_tab_button_border_highlight: "hsl(120, 60%,  0%)",
            HB_button:                      "hsl(120, 20%,  5%)",
            HB_button_active:               "hsl(120, 100%, 20%)",
            HB_button_text:                 "hsl(120, 100%, 60%)",
            HB_button_active_text:          "hsl(120, 100%, 80%)",
            HB_button_border:               "hsl(120, 100%, 30%)",
        }
    }
};

HB_COLOR_SCHEMES["BLUE"] = {
    HABDEC: {
        CSS: {
            HD_bg: 	            "hsl(210, 0%,   0%)",
            HD_fg: 	            "hsl(210, 50%,  20%)",
            HD_button: 	        "hsl(210, 100%, 4%)",
            HD_button_border:   "hsl(210, 100%, 30%)",
            HD_button_text: 	"hsl(210, 100%, 60%)",
            HD_label:      	    "hsl(210, 100%, 60%)",
            HD_highlight:    	"hsl(210, 80%,  30%)",
            HD_enabled:    	    "hsl(210, 100%, 40%)",
            HD_sentence:     	"hsl(210, 100%, 75%)"
        },
        SPECTRUM: {
            HIGH: "hsl(210, 30%, 100%)",
            MID: "hsl(210, 80%, 75%)",
            LOW: "hsl(210, 100%, 20%)",
            FILTER: "hsla(210, 50%, 30%, .5)"
        }
    },
    HABBOY: {
        CSS: {
            HB_bg:                          "hsl(210, 0%,   0%)",
            HB_text:                        "hsl(210, 100%, 60%)",
            HB_text_highlight:              "hsl(210, 80%,  45%)",
            HB_tab_button:                  "hsl(210, 100%, 5%)",
            HB_tab_button_active:           "hsl(210, 100%, 20%)",
            HB_tab_button_text:             "hsl(210, 100%, 60%)",
            HB_tab_button_active_text:      "hsl(210, 100%, 70%)",
            HB_tab_button_border:           "hsl(210, 100%, 40%)",
            HB_tab_button_border_highlight: "hsl(210, 60%,  0%)",
            HB_button:                      "hsl(210, 20%,  5%)",
            HB_button_active:               "hsl(210, 100%, 20%)",
            HB_button_text:                 "hsl(210, 100%, 60%)",
            HB_button_active_text:          "hsl(210, 100%, 80%)",
            HB_button_border:               "hsl(210, 100%, 30%)",
        }
    }
};

HB_COLOR_SCHEMES["GOLD"] = {
    HABDEC: {
        CSS: {
            HD_bg: 	            "hsl(40, 0%,   0%)",
            HD_fg: 	            "hsl(40, 50%,  20%)",
            HD_button: 	        "hsl(40, 100%, 4%)",
            HD_button_border:   "hsl(40, 100%, 30%)",
            HD_button_text: 	"hsl(40, 100%, 60%)",
            HD_label:      	    "hsl(40, 100%, 60%)",
            HD_highlight:    	"hsl(40, 80%,  30%)",
            HD_enabled:    	    "hsl(40, 100%, 40%)",
            HD_sentence:     	"hsl(40, 100%, 75%)"
        },
        SPECTRUM: {
            HIGH: "hsl(40, 30%, 100%)",
            MID: "hsl(40, 80%, 75%)",
            LOW: "hsl(40, 100%, 20%)",
            FILTER: "hsla(40, 50%, 30%, .5)"
        }
    },
    HABBOY: {
        CSS: {
            HB_bg:                          "hsl(40, 0%,   0%)",
            HB_text:                        "hsl(40, 100%, 60%)",
            HB_text_highlight:              "hsl(40, 80%,  45%)",
            HB_tab_button:                  "hsl(40, 100%, 5%)",
            HB_tab_button_active:           "hsl(40, 100%, 20%)",
            HB_tab_button_text:             "hsl(40, 100%, 60%)",
            HB_tab_button_active_text:      "hsl(40, 100%, 70%)",
            HB_tab_button_border:           "hsl(40, 100%, 40%)",
            HB_tab_button_border_highlight: "hsl(40, 60%,  0%)",
            HB_button:                      "hsl(40, 20%,  5%)",
            HB_button_active:               "hsl(40, 100%, 20%)",
            HB_button_text:                 "hsl(40, 100%, 60%)",
            HB_button_active_text:          "hsl(40, 100%, 80%)",
            HB_button_border:               "hsl(40, 100%, 30%)",
        }
    }
};

HB_COLOR_SCHEMES["PLUM"] = {
    HABDEC: {
        CSS: {
            HD_bg: 	            "hsl(300, 0%,   0%)",
            HD_fg: 	            "hsl(300, 50%,  20%)",
            HD_button: 	        "hsl(300, 100%, 4%)",
            HD_button_border:   "hsl(300, 100%, 30%)",
            HD_button_text: 	"hsl(300, 100%, 60%)",
            HD_label:      	    "hsl(300, 100%, 60%)",
            HD_highlight:    	"hsl(300, 80%,  30%)",
            HD_enabled:    	    "hsl(300, 100%, 40%)",
            HD_sentence:     	"hsl(300, 100%, 75%)"
        },
        SPECTRUM: {
            HIGH: "hsl(300, 30%, 100%)",
            MID: "hsl(300, 80%, 75%)",
            LOW: "hsl(300, 100%, 20%)",
            FILTER: "hsla(300, 50%, 30%, .5)"
        }
    },
    HABBOY: {
        CSS: {
            HB_bg:                          "hsl(300, 0%,   0%)",
            HB_text:                        "hsl(300, 100%, 60%)",
            HB_text_highlight:              "hsl(300, 80%,  45%)",
            HB_tab_button:                  "hsl(300, 100%, 5%)",
            HB_tab_button_active:           "hsl(300, 100%, 20%)",
            HB_tab_button_text:             "hsl(300, 100%, 60%)",
            HB_tab_button_active_text:      "hsl(300, 100%, 70%)",
            HB_tab_button_border:           "hsl(300, 100%, 40%)",
            HB_tab_button_border_highlight: "hsl(300, 60%,  0%)",
            HB_button:                      "hsl(300, 20%,  5%)",
            HB_button_active:               "hsl(300, 100%, 20%)",
            HB_button_text:                 "hsl(300, 100%, 60%)",
            HB_button_active_text:          "hsl(300, 100%, 80%)",
            HB_button_border:               "hsl(300, 100%, 30%)",
        }
    }
};


HB_COLOR_SCHEMES["WHITE"] = {
    HABDEC: {
        CSS: {
            HD_bg: 	            "hsl(0, 0%, 100%)",
            HD_fg: 	            "hsl(0, 50%,0%)",
            HD_button: 	        "hsl(0, 0%, 80%)",
            HD_button_border:   "hsl(0, 0%, 10%)",
            HD_button_text: 	"hsl(0, 0%, 0%)",
            HD_label:      	    "hsl(0, 0%, 0%)",
            HD_highlight:    	"hsl(0, 0%, 30%)",
            HD_enabled:    	    "hsl(0, 0%, 20%)",
            HD_sentence:     	"hsl(0, 0%, 75%)"
        },
        SPECTRUM: {
            HIGH: "hsl(0, 0%, 100%)",
            MID: "hsl(0, 0%, 25%)",
            LOW: "hsl(0, 0%, 0%)",
            FILTER: "hsla(0, 0%, 30%, .5)"
        }
    },
    HABBOY: {
        CSS: {
            HB_bg:                          "hsl(0, 0%,   100%)",
            HB_text:                        "hsl(0, 0%, 0%)",
            HB_text_highlight:              "hsl(0, 0%, 30%)",
            HB_tab_button:                  "hsl(0, 0%, 100%)",
            HB_tab_button_active:           "hsl(0, 0%, 20%)",
            HB_tab_button_text:             "hsl(0, 0%, 0%)",
            HB_tab_button_active_text:      "hsl(0, 0%, 80%)",
            HB_tab_button_border:           "hsl(0, 0%, 70%)",
            HB_tab_button_border_highlight: "hsl(0, 0%, 10%)",
            HB_button:                      "hsl(0, 0%, 100%)",
            HB_button_active:               "hsl(0, 0%, 20%)",
            HB_button_text:                 "hsl(0, 0%, 0%)",
            HB_button_active_text:          "hsl(0, 0%, 0%)",
            HB_button_border:               "hsl(0, 0%, 70%)",
        }
    }
};


function HB_ApplyColorScheme(i_scheme_name, i_color_scheme) {
    console.debug('i_scheme_name', i_scheme_name);
    HB_COLOR_SCHEME = i_color_scheme;
    let root = document.documentElement;
    for(prop in i_color_scheme['HABBOY']['CSS'])
        root.style.setProperty( '--' + prop, i_color_scheme['HABBOY']['CSS'][prop] );

    try {
        HB_GoogleMap.set('styles', HB_GMAP_COLOR_SCHEMES[i_scheme_name]);
    }
    catch(error) {
        console.debug(error);
        false;
    }
}