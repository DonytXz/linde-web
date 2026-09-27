# Excluded subproject: property valuation

The owner clarified that this product is for booking consultations with a law firm, with an immigration-law focus and no city-specific positioning. Property valuation is unrelated.

At the owner's explicit request, the `property_valuation` folder was removed. It is excluded from the proposed frontend repository, backend, API contract, branding inventory, and implementation backlog. No property records, valuation requests, map-based valuation flow, or Firebase valuation migration belong in the new product.

Before removal, the folder contained an independently built React app named `mapv2`, its own router, and Firebase-backed property lead collection. Repository inspection found no root-app integration. This explains the scope correction; it does not establish anything about an externally deployed Firebase project.

Deleting the local folder does not delete remote Firebase data, hosting, provider accounts, or copies in Git history. Any external-service retirement is a separate owner-directed task. No proposed valuation requirements document is part of this planning package.
