import { Input, Output } from '@nodl/core';
import { observer } from 'mobx-react-lite';
import * as React from 'react';

import { useHover } from '../../hooks/useHover/useHover';
import { StoreContext } from '../../stores/CircuitStore/CircuitStore';
import { Tooltip } from '../Tooltip/Tooltip';
import { TooltipPosition } from '../Tooltip/Tooltip.types';
import { portTypeStyles, portWrapperStyles } from './Port.styles';
import { PortProps } from './Port.types';

export const Port = observer(<T,>({ port }: PortProps<T>) => {
    const ref = React.useRef<HTMLDivElement>(null);
    const { onMouseEnter, onMouseLeave, isHovered } = useHover();
    const { onMouseEnter: onPortTypeEnter, onMouseLeave: onPortTypeLeave, isHovered: isPortTypeHovered } = useHover();
    const { store } = React.useContext(StoreContext);

    const isOutput = React.useMemo(() => port.constructor.name === 'Output', [port]);
    const tooltipPosition = React.useMemo(() => (isOutput ? TooltipPosition.RIGHT : TooltipPosition.LEFT), [isOutput]);
    const visuallyDisabled = React.useMemo(() => {
        const isOccupied = !isOutput && port.connected;
        const hasDifferentValueType = store.draftConnectionSource?.type !== port.type;
        const hasSharedNode = store.draftConnectionSource
            ? store.getNodeByPortId(store.draftConnectionSource.id) === store.getNodeByPortId(port.id)
            : false;
        // const isUnrelatedToConnectionDraft = store.draftConnectionSource !== port;

        return store.draftConnectionSource ? isOccupied || hasDifferentValueType || isOutput || hasSharedNode : false;
    }, [isOutput]);

    React.useEffect(() => {
        if (ref.current) {
            store.setPortElement(port.id, ref.current);

            return () => {
                store.removePortElement(port.id);
            };
        }
    }, []);

    const onMouseDown = React.useCallback(() => {
        if (isOutput) {
            store.setDraftConnectionSource(port as Output<any>);
        }
    }, [isOutput]);

    const onMouseUp = React.useCallback(() => {
        if (!isOutput && store.draftConnectionSource) {
            store.commitDraftConnection(port as Input<any>);
        }
    }, [isOutput]);

    const onClick = React.useCallback(() => {
        if (port.connected) {
            const connections = 'connection' in port ? [port.connection] : port.connections;

            for (const connection of connections) {
                if (connection) {
                    connection.dispose();
                }
            }
        }
    }, [port]);

    const portTypeName = React.useMemo(() => port.type.constructor.name.toUpperCase().replace('ZOD', ''), [port]);

    return (
        <Tooltip text={portTypeName} position={tooltipPosition}>
            <div
                ref={ref}
                className={portWrapperStyles(
                    port.connected ||
                        (!store.draftConnectionSource && isHovered) ||
                        (!!store.draftConnectionSource && !visuallyDisabled),
                    isOutput,
                    visuallyDisabled
                )}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onMouseUp={onMouseUp}
                onMouseDown={onMouseDown}
            >
                <div
                    className={portTypeStyles(
                        port.connected,
                        isOutput,
                        isHovered && !visuallyDisabled,
                        isPortTypeHovered && !visuallyDisabled
                    )}
                    onMouseEnter={onPortTypeEnter}
                    onMouseLeave={onPortTypeLeave}
                    onClick={onClick}
                >
                    {port.connected && isPortTypeHovered && !visuallyDisabled ? (
                        <span>x</span>
                    ) : (
                        <span>{portTypeName.charAt(0)}</span>
                    )}
                </div>
                <span>{port.name}</span>
            </div>
        </Tooltip>
    );
});
