/**
 * Marker the Convo stream route prepends to an error note so the client can tell
 * it apart from real model output and never persist it as an assistant turn.
 * A bracketed token (not a control char) so it survives text encoding intact.
 */
export const CONVO_STREAM_ERROR_MARK = '[[MAGPIE_STREAM_ERROR]]';
