/**
 * @file TransferStopWithDistance.ts
 * @brief Includes type definition of TransferStop with an extra distance
 * property
 *
 * @author Jan Vaclavik (xvacla35@stud.fit.vutbr.cz)
 */

import { TransferStop } from '../../types/TransferStop.ts';

export type TransferStopWithDistance = TransferStop & { distanceFromOrigin: number };