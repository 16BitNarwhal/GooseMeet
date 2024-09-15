import React, { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

export class MrGoose {
    // Location of model in `public` directory
    static modelUri = "/mrgoose.glb";

    // Default camera position
    static camera = { position: [30, 45, 60], fov: 50 };

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
    static Model = ({ currentAnimation, spin }) => {
        const group = useRef();
        const { nodes, materials, animations } = useGLTF(this.modelUri);
        const { actions } = useAnimations(animations, group);

        console.debug(`Loaded animations:${Object.keys(actions).map((key) => ` "${key}"`)}`);

        // Optional spinning logic
        useFrame(() => {
            if (spin && group.current) {
                group.current.rotation.y += 0.005; // Spin on Y-axis if 'spin' is true
            }
        });

        useEffect(() => {
            let activeAnimation = actions[this.Anims.IDLE]; // Default animation

            if (!actions) {
                console.error("No playable animations found for MyGoose");
                return;
            } else if (currentAnimation && !actions[currentAnimation]) {
                console.error(`Animation "${currentAnimation}" does not exist. See ${actions}`);
                return;
            }

            // Play the current animation
            if (currentAnimation) activeAnimation = actions[currentAnimation]; // Override default if present
            activeAnimation.reset().fadeIn(0.5).play();
            return () => activeAnimation.fadeOut(0.5);
        }, [actions, currentAnimation]);

        return (
            <group ref={group} dispose={null}>
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
