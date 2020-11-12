import React from 'react';
import { View, StyleSheet } from 'react-native';

import { UIComponent, UIColor } from '../services/UIKit';

const styles = StyleSheet.create({
    //
});

const PULSE_RINGS = [
    {
        diam: 40,
        color: '#F8F9F9',
    },
    {
        diam: 28,
        color: UIColor.white(),
    },
];

const PULSE_SIZE = 40;
const PULSE_CENTER_DIAM = 8;
const PULSE_CENTER_COLOR = UIColor.white();


// TODO: cross-platform component
// see here: https://www.npmjs.com/package/react-native-pulse-anim
// ---- I tried it, it even doesn't compile
// https://medium.com/@yousefkama/how-to-build-a-tinder-like-loader-animation-in-react-native-e2a4ace8f906
// -- here howtodo
export default class Pulsar extends UIComponent {
    componentDidMount() {
        const keyframes =
        `@-webkit-keyframes pulsate {
            0% {
                transform: scale(0.1, 0.1);
                opacity: 0.0;
            }
            50% {
                opacity: 1.0;
            }
            100% {
                transform: scale(1.3, 1.3);
                opacity: 0.0;
            }
        }`;
        const styleSheet = document.styleSheets[0];
        styleSheet?.insertRule(keyframes, styleSheet.cssRules.length);
    }

    render() {
        const animation = {
            opacity: 0,
            animationIterationCount: 'infinite',
            animationDuration: this.props.duration || '1s',
            animationName: 'pulsate',
            animationTimingFunction: 'ease-out',
        };

        const pulses = this.props.pulses || PULSE_RINGS;
        const pulseSize = this.props.size || PULSE_SIZE;
        const pulsesStyle = pulses.map(pulse => ({
            position: 'absolute',
            height: pulse.diam,
            width: pulse.diam,
            borderRadius: pulse.diam,
            left: (pulseSize - pulse.diam) / 2,
            top: (pulseSize - pulse.diam) / 2,
            borderColor: pulse.color,
            borderWidth: 1,
        }));

        const centerDiam = this.props.centerDiam || PULSE_CENTER_DIAM;
        const centerColor = this.props.centerColor || PULSE_CENTER_COLOR;
        const pulseCenter = {
            position: 'absolute',
            height: centerDiam,
            width: centerDiam,
            borderRadius: centerDiam,
            left: (pulseSize - centerDiam) / 2,
            top: (pulseSize - centerDiam) / 2,
            backgroundColor: centerColor,
        };

        return (
            <View style={{ width: pulseSize, height: pulseSize }}>
                <View style={pulseCenter} />
                {
                    pulsesStyle.map((style, rank) =>
                        <View key={`pulse-${rank}`} style={[style, animation]} />)
                }
            </View>
        );
    }
}
