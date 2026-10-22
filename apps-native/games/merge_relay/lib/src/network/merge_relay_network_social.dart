part of 'merge_relay_network.dart';

base mixin _MergeRelaySocialOperations on _MergeRelayHttpGatewayBase
    implements MergeRelayGateway {
  @override
  Future<MergeRelaySocialRecord> submitSocial(
    MergeRelaySocialRequest request,
  ) => _request(
    method: 'POST',
    path: 'social/${request.action.name}',
    body: request.toWireJson(),
    authenticated: true,
    parser: (data) => parseSocialRecord(data, request.action),
  );
}
