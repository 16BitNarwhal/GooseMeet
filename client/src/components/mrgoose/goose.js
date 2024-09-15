import React, { useEffect, useState, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { LoopOnce } from "three";

export class MrGoose {
    // Location of model in `public` directory
    static modelUri = "/mrgoose.glb";
    static honkUri = "/honk.mp3";

    // Default camera position
    static camera = { position: [30, 45, 40], fov: 50 };

    // List of available animations
    static Anims = class {
        static IDLE = "idle";
        static SPEAK_CYCLE = "speak";
        static SPEAK_START = "speak-start";
        static SPEAK_STOP = "speak-stop";
        static HONK = "honk";
        static LOOK_AROUND = "look";
        static WINGS_FLAP = "flap";
        static WINGS_SPREAD = "wings-spread";
        static WINGS_STORE = "wings-store";

        // Custom map function
        static map(callback) {
            return Object.values(this).map(callback);
        }
    };

    // Model component
    static Model = ({ currentAnimation, spin, allowHonk, updateAnimationCallback }) => {
        const group = useRef();
        const { nodes, materials, animations } = useGLTF(this.modelUri);
        const { actions } = useAnimations(animations, group);

        console.debug(`Loaded animations:${Object.keys(actions).map((key) => ` "${key}"`)}`);

        // If goose clicked
        const [clicked, setClicked] = useState(false);

        useFrame(() => {
            // Spinning
            if (spin && group.current) {
                group.current.rotation.y += 0.005; // Spin on Y-axis if 'spin' is true
            }

            // Honking
            if (allowHonk && clicked) {
                updateAnimationCallback(MrGoose.Anims.SPEAK_CYCLE);
                console.log("Honk!");
                const honk = new Audio(this.honkUri);
                honk.play();
                honk.onended = () => updateAnimationCallback(MrGoose.Anims.LOOK_AROUND);
                setClicked(false);
            }
        });

        // Handle current animation
        useEffect(() => {
            let activeAnimation = actions[this.Anims.IDLE]; // Default animation

            if (!actions) {
                console.error("No playable animations found for MyGoose");
                return;
            } else if (currentAnimation && !actions[currentAnimation]) {
                console.error(`Animation "${currentAnimation}" does not exist. See ${actions}`);
                return;
            }

            // Handle current animation
            if (currentAnimation) activeAnimation = actions[currentAnimation]; // Override default if present
            
            // Set no-loop for certain animations
            if (currentAnimation === this.Anims.SPEAK_CYCLE
                || currentAnimation === this.Anims.HONK
                || currentAnimation === this.Anims.WINGS_SPREAD
                || currentAnimation === this.Anims.WINGS_STORE
            ) {
                activeAnimation.setLoop(LoopOnce);
            }
            
            // Play and fade animation
            activeAnimation.reset().fadeIn(0.5).play();
            return () => activeAnimation.fadeOut(0.5);
        }, [actions, currentAnimation]);

        return (
            <group
                ref={group}
                dispose={null}
                onClick={() => {
                    console.log("honk?");
                    setClicked(allowHonk);
                }}
            >
                <group name="Scene">
                    <group name="goose" rotation={[Math.PI / 2, 0, 0]}>
                        <group name="mesh">
                            <skinnedMesh
                                name="goose_mesh"
                                geometry={nodes.goose_mesh.geometry}
                                material={materials.White}
                                skeleton={nodes.goose_mesh.skeleton}
                            />
                            <skinnedMesh
                                name="goose_mesh_1"
                                geometry={nodes.goose_mesh_1.geometry}
                                material={materials.Orange}
                                skeleton={nodes.goose_mesh_1.skeleton}
                            />
                            <skinnedMesh
                                name="goose_mesh_2"
                                geometry={nodes.goose_mesh_2.geometry}
                                material={materials.Black}
                                skeleton={nodes.goose_mesh_2.skeleton}
                            />
                        </group>
                        <primitive object={nodes.body} />
                    </group>
                </group>
            </group>
        );
    };
}

useGLTF.preload(MrGoose.modelUri);
