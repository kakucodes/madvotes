import { useChain } from "@cosmos-kit/react";
import { MadvotesClient } from "../codegen/Madvotes.client";
import {
  useMadvotesGetPositionQuery,
  useMadvotesListMarketsQuery,
} from "../codegen/Madvotes.react-query";
import { PROVIDER_CHAIN, useMadvotesSigningClient } from "./useMadvotes";
import { useQueries } from "@tanstack/react-query";

export const useGetUserPosition = (
  signingClient?: MadvotesClient,
  address?: string,
  proposalId?: number,
) => {
  const { data: position } = useMadvotesGetPositionQuery({
    client: signingClient,
    args: {
      depositor: address ?? "",
      proposalId: proposalId ?? 0,
    },
    options: { enabled: !!signingClient && !!address && !!proposalId },
  });
  return position;
};

export const useGetUserPositions = () => {
  const { data: signingClient } = useMadvotesSigningClient();
  const { address } = useChain(PROVIDER_CHAIN);
  const { data: markets } = useMadvotesListMarketsQuery({
    client: signingClient,
    args: {},
    options: { enabled: !!signingClient },
  });
  return useQueries({
    queries: (markets?.markets || []).map((prop) => ({
      queryKey: ["user-position", prop.proposal_id],
      queryFn: async () => {
        if (!signingClient || !address) return null;
        const position = await signingClient.getPosition({
          depositor: address,
          proposalId: prop.proposal_id,
        });
        return position.positions.length > 0
          ? { ...position, proposalId: position.proposal_id, ...prop }
          : null;
      },
    })),
  });
};
